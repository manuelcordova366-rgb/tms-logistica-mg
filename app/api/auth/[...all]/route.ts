import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'
import { ensureSchema } from '@/lib/db/ensure-schema'

const handlers = toNextJsHandler(auth)

export async function GET(request: Request) {
  await ensureSchema()
  return handlers.GET(request)
}

export async function POST(request: Request) {
  await ensureSchema()
  return handlers.POST(request)
}
