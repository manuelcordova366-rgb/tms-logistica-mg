'use client'

import { useState } from 'react'
import { AlertTriangle, Ban, CalendarClock, CircleArrowDown, FastForward, CircleCheck, Clock3, Navigation, Pencil, Radio, RotateCcw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFleet } from '@/lib/fleet-store'
import { currentHHMM, formatPlanDate } from '@/lib/fleet-format'
import type { SupervisorStatus, Trip } from '@/lib/fleet-data'
import { SUP_SUPERVISOR } from '@/lib/fleet-status'
import { EmptyRow, FilterChip, IconButton, KindTag, Panel, PlanChip, SearchField, StatusPill } from './primitives'
import { MapPin } from 'lucide-react'

const STATUS_FILTERS: { id: SupervisorStatus; label: string; icon?: typeof Clock3; danger?: boolean }[] = [
  { id: 'CARGADO', label: 'Cargados' },
  { id: 'EN RUTA', label: 'En Ruta', icon: Navigation },
  { id: 'EN SUCURSAL', label: 'Espera Descarga', icon: Clock3 },
  { id: 'DESCARGANDO', label: 'Descargando', icon: CircleArrowDown },
  { id: 'RETORNO', label: 'Retorno', icon: RotateCcw },
  { id: 'ALERTA', label: 'Retrasado / Alerta', icon: AlertTriangle, danger: true },
  { id: 'COMPLETADO', label: 'Completado', icon: CircleCheck },
  { id: 'CANCELADO', label: 'Cancelado', icon: Ban, danger: true },
  { id: 'REPROGRAMADO', label: 'Reprogramado', icon: CalendarClock },
  { id: 'CONTINUACIÓN', label: 'Continuación', icon: FastForward },
]

const QUICK: { status: SupervisorStatus; label: string; cls: string; active: string }[] = [
  { status: 'EN RUTA', label: 'Ruta', cls: 'border-success/40 bg-success/10 text-success', active: 'bg-success text-background' },
  { status: 'EN SUCURSAL', label: 'En Sucursal', cls: 'border-warning/40 bg-warning/10 text-warning', active: 'bg-warning text-background' },
  { status: 'DESCARGANDO', label: 'Descargando', cls: 'border-primary/40 bg-primary/10 text-primary', active: 'bg-primary text-primary-foreground' },
  { status: 'RETORNO', label: 'Retorno', cls: 'border-violet/40 bg-violet/10 text-violet', active: 'bg-violet text-foreground' },
  { status: 'ALERTA', label: 'Alerta', cls: 'border-danger/40 bg-danger/10 text-danger', active: 'bg-danger text-foreground' },
  { status: 'COMPLETADO', label: 'Fin', cls: 'border-success/40 bg-success/5 text-success', active: 'bg-success text-background' },
  { status: 'CANCELADO', label: 'Cancelado', cls: 'border-danger/40 bg-danger/5 text-danger', active: 'bg-danger text-foreground' },
  { status: 'REPROGRAMADO', label: 'Reprog.', cls: 'border-warning/40 bg-warning/5 text-warning', active: 'bg-warning text-background' },
  { status: 'CONTINUACIÓN', label: 'Continuación', cls: 'border-violet/40 bg-violet/5 text-violet', active: 'bg-violet text-foreground' },
]

export function SupervisorView({ onEditTrip }: { onEditTrip: (trip: Trip) => void }) {
  const { trips, unitByEco, planDate, dispatch } = useFleet()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<'all' | 'LOCAL' | 'FORÁNEO'>('all')
  const [status, setStatus] = useState<SupervisorStatus | 'all'>('all')

  const dispatched = trips
    .filter((t) => t.planStatus === 'CARGADO' && unitByEco.get(t.eco)?.patioStatus !== 'taller')
    .sort((a, b) => (a.folio ?? 999) - (b.folio ?? 999))

  const visible = dispatched.filter((t) => {
    if (kind !== 'all' && t.kind !== kind) return false
    if (status !== 'all' && t.supStatus !== status) return false
    if (query) {
      const hay = [t.eco, t.operador, t.pipa, t.destino, ...t.entregas].join(' ').toLowerCase()
      if (!hay.includes(query.toLowerCase())) return false
    }
    return true
  })

  return (
    <div className="flex flex-col gap-5">
      <Panel className="flex flex-col gap-4 p-5">
        <SearchField
          aria-label="Buscar en supervisor"
          placeholder="Buscar por ECO, operador, pipa o destino..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full md:w-80"
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={kind === 'all'} onClick={() => setKind('all')}>
            Todas
          </FilterChip>
          <FilterChip active={kind === 'LOCAL'} onClick={() => setKind('LOCAL')}>
            Locales ({dispatched.filter((t) => t.kind === 'LOCAL').length})
          </FilterChip>
          <FilterChip active={kind === 'FORÁNEO'} onClick={() => setKind('FORÁNEO')}>
            Foráneas ({dispatched.filter((t) => t.kind === 'FORÁNEO').length})
          </FilterChip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={status === 'all'} onClick={() => setStatus('all')}>
            Todos ({dispatched.length})
          </FilterChip>
          {STATUS_FILTERS.map(({ id, label, icon: Icon, danger }) => {
            const n = dispatched.filter((t) => t.supStatus === id).length
            return (
              <FilterChip key={id} active={status === id} tone={danger ? 'danger' : 'primary'} onClick={() => setStatus(id)}>
                {Icon && <Icon className="size-3.5" aria-hidden />}
                {label}
                {(id === 'CARGADO' || n > 0) && ` (${n})`}
              </FilterChip>
            )
          })}
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Radio className="size-5 text-primary" aria-hidden />
              Supervisor: Monitoreo en Tránsito y Sucursales
            </h2>
            <PlanChip label={formatPlanDate(planDate)} />
          </div>
          <p className="text-sm text-muted-foreground">Actualice el estatus de la unidad con un solo clic conforme se reciban reportes satelitales o de operadores</p>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1500px] text-sm">
            <thead>
              <tr className="border-b-2 border-primary/60 text-left font-mono text-xs tracking-widest text-primary uppercase">
                <th scope="col" className="sticky left-0 z-10 w-24 bg-card px-4 py-4 font-semibold">Económico</th>
                <th scope="col" className="sticky left-24 z-10 w-44 bg-card px-3 py-4 font-semibold">Operador</th>
                <th scope="col" className="px-3 py-4 font-semibold">Destino &amp; tipo</th>
                <th scope="col" className="px-3 py-4 font-semibold">Salida</th>
                <th scope="col" className="px-3 py-4 font-semibold">Tiempo est.</th>
                <th scope="col" className="px-3 py-4 font-semibold">ETA</th>
                <th scope="col" className="px-3 py-4 font-semibold">Estatus actual</th>
                <th scope="col" className="px-3 py-4 font-semibold">Cambio rápido de estatus (supervisor)</th>
                <th scope="col" className="px-3 py-4 font-semibold">Observaciones / bitácora</th>
                <th scope="col" className="px-3 py-4 text-center font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && <EmptyRow colSpan={10}>Sin unidades en tránsito con estos filtros</EmptyRow>}
              {visible.map((t) => {
                const st = SUP_SUPERVISOR[t.supStatus]
                return (
                  <tr key={t.id} className="group border-b border-border/70">
                    <td className="sticky left-0 z-10 bg-card px-4 py-4 group-hover:bg-accent">
                      <span className="inline-flex flex-col rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 font-mono text-sm leading-tight font-semibold text-primary">
                        <span>ECO</span>
                        <span>{t.eco}</span>
                      </span>
                    </td>
                    <td className="sticky left-24 z-10 bg-card px-3 py-4 group-hover:bg-accent">
                      <p className="font-semibold uppercase">{t.operador}</p>
                      <p className="font-mono text-xs text-muted-foreground">Turno: {t.turno}</p>
                    </td>
                    <td className="max-w-60 px-3 py-4">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                        <span className="font-semibold">{t.destino}</span>
                      </div>
                      <div className="mt-1.5 flex gap-1.5">
                        <KindTag kind={t.kind} />
                      </div>
                    </td>
                    <td className="px-3 py-4 font-mono font-bold">{t.salida || '—'}</td>
                    <td className="px-3 py-4 font-mono">{t.tiempoEst || '—'}</td>
                    <td className="px-3 py-4 font-mono text-primary">{t.eta || ''}</td>
                    <td className="px-3 py-4">
                      <StatusPill tone={st.tone} className="max-w-28">
                        {st.label}
                      </StatusPill>
                    </td>
                    <td className="px-3 py-4">
                      <div className="grid w-fit grid-cols-[auto_auto_auto] gap-1.5">
                        {QUICK.map((q) => {
                          const active = t.supStatus === q.status
                          return (
                            <button
                              key={q.status}
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                dispatch({ type: 'setSupStatus', id: t.id, status: active ? 'CARGADO' : q.status, time: currentHHMM() })
                              }
                              className={cn('rounded border px-2 py-0.5 text-xs font-semibold transition-colors', q.cls, active && q.active)}
                            >
                              {q.label}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                    <td className="max-w-56 px-3 py-4 text-xs text-muted-foreground">{t.observaciones || 'Sin incidencias registradas'}</td>
                    <td className="px-3 py-4">
                      <div className="flex justify-center gap-1.5">
                        <IconButton label={`Editar viaje de ECO ${t.eco}`} onClick={() => onEditTrip(t)}>
                          <Pencil />
                        </IconButton>
                        <IconButton
                          label={`Eliminar viaje de ECO ${t.eco}`}
                          tone="danger"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar el viaje #${t.folio ?? '—'} de ECO ${t.eco}?`)) dispatch({ type: 'deleteTrip', id: t.id })
                          }}
                        >
                          <Trash2 />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
