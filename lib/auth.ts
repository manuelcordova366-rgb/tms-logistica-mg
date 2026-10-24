import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'
import type { SocialProviderId } from '@/lib/auth-shared'

// Roles, statuses and their labels live in `lib/auth-shared.ts` so client components can
// import them without pulling this server-only module (and the database pool) along.
export type { AppRole, AppUser, AppUserStatus, SocialProviderId } from '@/lib/auth-shared'
export { ROLE_LABEL, USER_STATUS_LABEL } from '@/lib/auth-shared'

// The Base44 preview proxy serves the app from https://3000-<suffix>.<domain>, a different
// origin than localhost, so sign-in requests from it must be trusted too. Gated on the
// sandbox flag: with it unset the origin list keeps its original contents.
const previewOrigins =
  process.env.BASE44_PREVIEW_MODE === '1' && process.env.BASE44_PUBLIC_HOST_SUFFIX
    ? [`https://3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`]
    : []

// Google / Outlook sign-in is only wired up once the credentials exist, so the app keeps
// booting (and shows which provider is missing) while they are being configured.
const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
    ? {
        microsoft: {
          clientId: process.env.MICROSOFT_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          tenantId: process.env.MICROSOFT_TENANT_ID ?? 'common',
        },
      }
    : {}),
}

export const SOCIAL_PROVIDERS: SocialProviderId[] = ['google', 'microsoft']
export const enabledSocialProviders = Object.keys(socialProviders) as SocialProviderId[]

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  socialProviders,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'supervisor', input: false },
      status: { type: 'string', required: false, defaultValue: 'pending', input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (newUser) => {
          // The very first account becomes the administrator so someone can approve everyone else.
          const { rows } = await pool.query<{ count: string }>('SELECT count(*)::text AS count FROM "user"')
          const isFirst = rows[0]?.count === '0'
          return {
            data: {
              ...newUser,
              role: isFirst ? 'admin' : 'supervisor',
              status: isFirst ? 'approved' : 'pending',
            },
          }
        },
      },
    },
  },
  trustedOrigins: [
    ...(process.env.NODE_ENV === 'development'
      ? [
          'http://localhost:3000',
          ...previewOrigins,
          ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
          ...(process.env.V0_DEV_APP_URL ? [process.env.V0_DEV_APP_URL] : []),
          ...(process.env.V0_BUILD_URL ? [process.env.V0_BUILD_URL] : []),
          ...(process.env.V0_SANDBOX_URL ? [process.env.V0_SANDBOX_URL] : []),
        ]
      : []),
    ...(process.env.NODE_ENV === 'production'
      ? [
          ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
          ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // Required by the cross-site preview iframe. Without these
          // attributes, login succeeds but the next request appears signed out.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
