'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { Check, Loader2, ShieldCheck, Trash2, UserRound, X } from 'lucide-react'
import { deleteUser, listUsers, setUserRole, setUserStatus, type ManagedUser } from '@/app/actions/users'
import { ROLE_LABEL, USER_STATUS_LABEL, type AppRole } from '@/lib/auth-shared'
import { Panel } from './primitives'

const STATUS_TONE: Record<ManagedUser['status'], string> = {
  pending: 'border-warning/40 bg-warning/10 text-warning',
  approved: 'border-success/40 bg-success/10 text-success',
  rejected: 'border-danger/40 bg-danger/10 text-danger',
}

/** Administrator-only screen: approve registrations and assign roles. */
export function UsersView() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, startTransition] = useTransition()

  const refresh = useCallback(async () => {
    try {
      setUsers(await listUsers())
      setError('')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudieron cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const run = (action: () => Promise<void>) =>
    startTransition(async () => {
      try {
        await action()
        await refresh()
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : 'No se pudo aplicar el cambio')
      }
    })

  const pendingCount = users.filter((u) => u.status === 'pending').length

  return (
    <div className="flex flex-col gap-5">
      <Panel className="flex flex-col gap-3 border-l-4 border-l-primary p-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <UserRound className="size-6 text-primary" aria-hidden />
          Usuarios
        </h2>
        <p className="text-sm text-secondary-foreground">
          Aprueba o rechaza solicitudes de registro y define el rol de cada cuenta. El primer registro queda como Admón aprobado.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-xs font-bold text-primary">
            {users.length} cuentas
          </span>
          <span className="rounded-full border border-warning/40 bg-warning/10 px-3 py-1 font-mono text-xs font-bold text-warning">
            {pendingCount} pendientes
          </span>
          {busy && <Loader2 className="size-4 animate-spin text-primary" aria-hidden />}
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b-2 border-primary/60 text-left font-mono text-xs tracking-widest text-primary uppercase">
                <th scope="col" className="px-5 py-4 font-semibold">Usuario</th>
                <th scope="col" className="px-4 py-4 font-semibold">Rol</th>
                <th scope="col" className="px-4 py-4 font-semibold">Estatus</th>
                <th scope="col" className="px-4 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Cargando usuarios…
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Todavía no hay cuentas registradas.
                  </td>
                </tr>
              )}
              {users.map((managed) => (
                <tr key={managed.id} className="border-b border-border/70 hover:bg-accent/40">
                  <td className="px-5 py-4">
                    <p className="font-semibold">{managed.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{managed.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <label className="sr-only" htmlFor={`role-${managed.id}`}>
                      Rol de {managed.name}
                    </label>
                    <select
                      id={`role-${managed.id}`}
                      value={managed.role}
                      disabled={busy}
                      onChange={(e) => run(() => setUserRole(managed.id, e.target.value as AppRole))}
                      className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                    >
                      {(Object.keys(ROLE_LABEL) as AppRole[]).map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABEL[role]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${STATUS_TONE[managed.status]}`}>
                      <ShieldCheck className="size-3.5" aria-hidden />
                      {USER_STATUS_LABEL[managed.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={busy || managed.status === 'approved'}
                        onClick={() => run(() => setUserStatus(managed.id, 'approved'))}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-success/40 bg-success/10 px-3 text-xs font-semibold text-success disabled:opacity-50"
                      >
                        <Check className="size-3.5" aria-hidden />
                        Aceptar
                      </button>
                      <button
                        type="button"
                        disabled={busy || managed.status === 'rejected'}
                        onClick={() => run(() => setUserStatus(managed.id, 'rejected'))}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-warning/40 bg-warning/10 px-3 text-xs font-semibold text-warning disabled:opacity-50"
                      >
                        <X className="size-3.5" aria-hidden />
                        Rechazar
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`Eliminar a ${managed.name}`}
                        onClick={() => {
                          if (window.confirm(`¿Eliminar la cuenta ${managed.email}?`)) void run(() => deleteUser(managed.id))
                        }}
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-danger/30 bg-danger/10 text-danger disabled:opacity-50"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {error && (
          <p role="alert" className="border-t border-border px-5 py-3 text-sm text-danger">
            {error}
          </p>
        )}
      </Panel>
    </div>
  )
}
