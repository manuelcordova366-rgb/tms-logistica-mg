'use client'

import { useState } from 'react'
import { CircleX, Clock3, Loader2, LogIn, LogOut, ShieldCheck } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { PROVIDER_LABEL, ROLE_LABEL, type AppUser, type SocialProviderId } from '@/lib/auth-shared'
import { BrandBackdrop } from './brand-backdrop'
import { NetworkBackground } from './network-background'

/**
 * Shown while nobody is signed in, and to accounts the administrator has not approved
 * yet. Sign-in is delegated to better-auth (Google / Microsoft) so the app never sees
 * the user's password.
 */
export function AuthScreen({ providers, user }: { providers: SocialProviderId[]; user: AppUser | null }) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <NetworkBackground />
      <BrandBackdrop />
      {user ? <PendingCard user={user} /> : <SignInCard providers={providers} />}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="w-full max-w-md rounded-2xl border border-border bg-card/85 p-6 shadow-2xl shadow-background/60 backdrop-blur-md">
      {children}
    </section>
  )
}

function SignInCard({ providers }: { providers: SocialProviderId[] }) {
  const [busy, setBusy] = useState<SocialProviderId | null>(null)
  const [error, setError] = useState('')

  async function signIn(provider: SocialProviderId) {
    setBusy(provider)
    setError('')
    const { error: failure } = await authClient.signIn.social({ provider, callbackURL: '/' })
    if (failure) {
      setError(failure.message ?? 'No se pudo iniciar sesión.')
      setBusy(null)
    }
  }

  return (
    <Card>
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-24 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logistica-mg-logo-mark.png" alt="Logística M&G TMS" className="h-auto w-full" />
        </div>
        <h1 className="text-xl font-bold">Control de Flota</h1>
        <p className="text-sm text-muted-foreground">Inicia sesión con tu cuenta de Gmail u Outlook. El administrador debe aprobar tu registro antes de que puedas entrar.</p>
      </div>

      <div className="flex flex-col gap-2">
        {providers.map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={() => signIn(provider)}
            disabled={busy !== null}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
          >
            {busy === provider ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LogIn className="size-4" aria-hidden />}
            {PROVIDER_LABEL[provider]}
          </button>
        ))}
        {providers.length === 0 && (
          <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
            Todavía no hay credenciales de Google ni de Microsoft configuradas, así que el inicio de sesión está deshabilitado.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </Card>
  )
}

function PendingCard({ user }: { user: AppUser }) {
  const [busy, setBusy] = useState(false)
  const rejected = user.status === 'rejected'
  const Icon = rejected ? CircleX : Clock3

  return (
    <Card>
      <div className="flex flex-col items-center gap-3 text-center">
        <Icon className={rejected ? 'size-10 text-danger' : 'size-10 text-warning'} aria-hidden />
        <h1 className="text-xl font-bold">{rejected ? 'Solicitud rechazada' : 'Solicitud en revisión'}</h1>
        <p className="text-sm text-secondary-foreground">
          {rejected
            ? 'Tu acceso a Control de Flota fue rechazado. Contacta al administrador si crees que es un error.'
            : 'Tu registro fue recibido. Un administrador debe aprobarlo para que puedas entrar.'}
        </p>
        <dl className="mt-1 w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-left text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Cuenta</dt>
            <dd className="font-semibold">{user.email}</dd>
          </div>
          <div className="mt-1 flex justify-between gap-3">
            <dt className="text-muted-foreground">Rol solicitado</dt>
            <dd className="inline-flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="size-4 text-primary" aria-hidden />
              {ROLE_LABEL[user.role]}
            </dd>
          </div>
        </dl>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await authClient.signOut()
            window.location.reload()
          }}
          className="mt-2 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-secondary px-4 text-sm font-semibold"
        >
          <LogOut className="size-4" aria-hidden />
          Cerrar sesión
        </button>
      </div>
    </Card>
  )
}
