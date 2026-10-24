import { AppShell } from '@/components/fleet/app-shell'
import { AuthScreen } from '@/components/fleet/auth-screen'
import { enabledSocialProviders } from '@/lib/auth'
import { getCurrentUser } from '@/lib/session'

export default async function Page() {
  const user = await getCurrentUser()

  // Signed out, or registered but not approved by an administrator yet.
  if (!user || user.status !== 'approved') {
    return <AuthScreen providers={enabledSocialProviders} user={user} />
  }

  return <AppShell user={user} />
}
