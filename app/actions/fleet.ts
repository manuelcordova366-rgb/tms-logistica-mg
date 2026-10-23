'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { fleetState } from '@/lib/db/schema'
import { requireApprovedUser } from '@/lib/session'
import type { FleetData } from '@/lib/fleet-data'

const STATE_ID = 'main'
const MAX_BYTES = 5_000_000

export async function loadFleetState(): Promise<{ data: FleetData; updatedAt: string } | null> {
  await requireApprovedUser()
  const [row] = await db.select().from(fleetState).where(eq(fleetState.id, STATE_ID)).limit(1)
  if (!row) return null
  return { data: row.data as FleetData, updatedAt: row.updatedAt.toISOString() }
}

function isFleetData(value: unknown): value is FleetData {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return Array.isArray(v.units) && Array.isArray(v.trips) && Array.isArray(v.history) && typeof v.planDate === 'string'
}

export async function saveFleetState(data: FleetData) {
  const current = await requireApprovedUser()
  if (!isFleetData(data)) throw new Error('Datos inválidos')
  if (JSON.stringify(data).length > MAX_BYTES) throw new Error('Datos demasiado grandes')
  const now = new Date()
  await db
    .insert(fleetState)
    .values({ id: STATE_ID, data, updatedAt: now, updatedBy: current.id })
    .onConflictDoUpdate({ target: fleetState.id, set: { data, updatedAt: now, updatedBy: current.id } })
  return { updatedAt: now.toISOString() }
}
