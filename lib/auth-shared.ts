/**
 * Roles, account statuses and labels shared by the server (better-auth) and the UI.
 *
 * Kept free of imports so client components can use it without pulling `lib/auth.ts`
 * (which loads the database pool) into the browser bundle.
 */
export type AppRole = 'admin' | 'supervisor'
export type AppUserStatus = 'pending' | 'approved' | 'rejected'

export interface AppUser {
  id: string
  name: string
  email: string
  role: AppRole
  status: AppUserStatus
}

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: 'Admón',
  supervisor: 'Supervisor',
}

export const USER_STATUS_LABEL: Record<AppUserStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

export type SocialProviderId = 'google' | 'microsoft'

export const PROVIDER_LABEL: Record<SocialProviderId, string> = {
  google: 'Continuar con Gmail',
  microsoft: 'Continuar con Outlook',
}
