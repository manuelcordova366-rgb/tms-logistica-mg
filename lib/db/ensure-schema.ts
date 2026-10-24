import { getMigrations } from 'better-auth/db/migration'
import { auth } from '@/lib/auth'
import { pool } from './index'

/**
 * The repo ships no migration runner (no drizzle-kit config, no SQL folder) and the
 * compose setup is not part of this branch, so the schema is created idempotently on
 * the first database access instead.
 *
 * Better Auth's own tables (`user`, `session`, `account`, `verification`) are created
 * through its migration API, which derives the columns from the configured auth
 * instance — so they cannot drift from the installed version. `fleet_state` mirrors
 * `lib/db/schema.ts`.
 */
const FLEET_STATE_SQL = `
  create table if not exists "fleet_state" (
    "id" text primary key,
    "data" jsonb not null,
    "updatedAt" timestamptz not null default now(),
    "updatedBy" text
  )
`

let ready: Promise<void> | null = null

async function applySchema() {
  const { runMigrations } = await getMigrations(auth.options)
  await runMigrations()
  await pool.query(FLEET_STATE_SQL)
}

/** Runs once per server process; a failure is retried on the next call. */
export function ensureSchema() {
  ready ??= applySchema().catch((error) => {
    ready = null
    throw error
  })
  return ready
}
