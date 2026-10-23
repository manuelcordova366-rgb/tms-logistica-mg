'use server'

import { and, asc, eq, ne } from 'drizzle-orm'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/session'
import type { AppUser } from '@/lib/auth'

export type ManagedUser = AppUser & { createdAt: string }

const STATUSES = ['pending', 'approved', 'rejected'] as const
const ROLES = ['admin', 'user'] as const

export async function listUsers(): Promise<ManagedUser[]> {
  await requireAdmin()
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt })
    .from(user)
    .orderBy(asc(user.createdAt))
  return rows.map((r) => ({ ...(r as AppUser), createdAt: r.createdAt.toISOString() }))
}

export async function setUserStatus(id: string, status: AppUser['status']) {
  const admin = await requireAdmin()
  if (!STATUSES.includes(status)) throw new Error('Estatus inválido')
  if (id === admin.id) throw new Error('No puedes cambiar tu propio estatus')
  await db.update(user).set({ status, updatedAt: new Date() }).where(eq(user.id, id))
}

export async function setUserRole(id: string, role: AppUser['role']) {
  const admin = await requireAdmin()
  if (!ROLES.includes(role)) throw new Error('Rol inválido')
  if (id === admin.id) throw new Error('No puedes cambiar tu propio rol')
  await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, id))
}

export async function deleteUser(id: string) {
  const admin = await requireAdmin()
  if (id === admin.id) throw new Error('No puedes eliminar tu propia cuenta')
  await db.delete(user).where(and(eq(user.id, id), ne(user.id, admin.id)))
}
