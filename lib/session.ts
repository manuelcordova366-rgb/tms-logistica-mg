import 'server-only'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { auth, type AppUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'

export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  // Read role/status straight from the DB so approvals take effect immediately.
  const [row] = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)
  return row ? (row as AppUser) : null
}

export async function requireApprovedUser() {
  const current = await getCurrentUser()
  if (!current || current.status !== 'approved') throw new Error('No autorizado')
  return current
}

export async function requireAdmin() {
  const current = await requireApprovedUser()
  if (current.role !== 'admin') throw new Error('Solo administradores')
  return current
}
