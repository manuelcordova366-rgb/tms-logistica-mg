'use client'

import { useState } from 'react'
import { CircleCheck, CircleArrowRight, CirclePlus, Package, Pencil, Trash2, UserRound, Wrench, Route } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isUnitBusy, useFleet } from '@/lib/fleet-store'
import { FLEET_GROUP_LABEL, fleetGroupOf, type FleetGroup, type Trip, type Unit } from '@/lib/fleet-data'
import { EcoBadge, FilterChip, IconButton, Panel, SearchField } from './primitives'

type Column = 'disponible' | 'ruta' | 'colocado' | 'cargado' | 'taller'

const COLUMNS: { id: Column; title: string; subtitle: string; icon: typeof Wrench; tone: string; badge: string }[] = [
  { id: 'disponible', title: 'Disponible en Patio', subtitle: 'Sin ruta asignada; listas para programar', icon: CircleCheck, tone: 'text-success', badge: 'border-success/40 bg-success/10 text-success' },
  { id: 'ruta', title: 'Ruta asignada', subtitle: 'En patio, pero no disponible para otra ruta', icon: CircleArrowRight, tone: 'text-primary', badge: 'border-warning/40 bg-warning/10 text-warning' },
  { id: 'colocado', title: 'Colocado p/ Carga', subtitle: 'En rampa/cajón esperando mercancía', icon: CircleArrowRight, tone: 'text-warning', badge: 'border-warning/40 bg-warning/10 text-warning' },
  { id: 'cargado', title: 'Cargado', subtitle: 'Mercancía completa, lista para planeación', icon: Package, tone: 'text-primary', badge: 'border-primary/40 bg-primary/10 text-primary' },
  { id: 'taller', title: 'Taller / Mtto', subtitle: 'Fuera de servicio por revisión mecánica', icon: Wrench, tone: 'text-danger', badge: 'border-danger/40 bg-danger/10 text-danger' },
]

export function PatioView({
  onNewUnit,
  onEditUnit,
  onNewTrip,
}: {
  onNewUnit: () => void
  onEditUnit: (unit: Unit) => void
  onNewTrip: (eco: string) => void
}) {
  const { units, tripsByEco, dispatch } = useFleet()
  const [query, setQuery] = useState('')
  const [assign, setAssign] = useState<'all' | 'busy' | 'free'>('all')
  const [group, setGroup] = useState<FleetGroup | 'all'>('all')

  const columnOf = (u: Unit): Column => (isUnitBusy(u, tripsByEco) ? 'cargado' : u.patioStatus)
  const busyCount = units.filter((u) => isUnitBusy(u, tripsByEco)).length
  const freeCount = units.filter((u) => columnOf(u) === 'disponible').length

  const visible = units.filter((u) => {
    const busy = isUnitBusy(u, tripsByEco)
    if (assign === 'busy' && !busy) return false
    if (assign === 'free' && columnOf(u) !== 'disponible') return false
    if (group !== 'all' && fleetGroupOf(u.kind) !== group) return false
    if (query) {
      const trips = tripsByEco.get(u.eco) ?? []
      const hay = [u.eco, u.placas, u.kind, ...trips.flatMap((t) => [String(t.folio), t.operador, t.destino])].join(' ').toLowerCase()
      if (!hay.includes(query.toLowerCase())) return false
    }
    return true
  })

  return (
    <div className="flex flex-col gap-5">
      <Panel className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <SearchField
            aria-label="Buscar unidad"
            placeholder="Buscar por ECO, viaje, operador, destino..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-[460px]"
          />
          <span className="text-sm text-muted-foreground">Asignación:</span>
          <FilterChip active={assign === 'all'} onClick={() => setAssign('all')}>
            Todos ({units.length})
          </FilterChip>
          <FilterChip active={assign === 'busy'} onClick={() => setAssign('busy')}>
            <Route className="size-3.5" aria-hidden />
            Con Viaje / Asignadas ({busyCount})
          </FilterChip>
          <FilterChip active={assign === 'free'} onClick={() => setAssign('free')}>
            Libres ({freeCount})
          </FilterChip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Tipo:</span>
          <FilterChip active={group === 'all'} onClick={() => setGroup('all')}>
            Todos
          </FilterChip>
          {(Object.keys(FLEET_GROUP_LABEL) as FleetGroup[]).map((g) => (
            <FilterChip key={g} active={group === g} onClick={() => setGroup(g)}>
              {FLEET_GROUP_LABEL[g]} ({units.filter((u) => fleetGroupOf(u.kind) === g).length})
            </FilterChip>
          ))}
        </div>
        <div>
          <button
            type="button"
            onClick={onNewUnit}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-success px-4 text-sm font-semibold text-background shadow-lg shadow-success/25 hover:bg-success/90"
          >
            <CirclePlus className="size-4" aria-hidden />
            Registrar Unidad en Patio
          </button>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = visible.filter((u) => columnOf(u) === col.id)
          const Icon = col.icon
          return (
            <Panel key={col.id} aria-labelledby={`col-${col.id}`} className="flex h-[580px] flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <h2 id={`col-${col.id}`} className="flex items-center gap-2 text-base font-bold">
                    <Icon className={cn('size-5', col.tone)} aria-hidden />
                    {col.title}
                  </h2>
                  <p className="text-xs text-muted-foreground">{col.subtitle}</p>
                </div>
                <span className={cn('inline-flex h-8 min-w-10 items-center justify-center rounded-full border px-2 font-mono text-sm font-bold', col.badge)}>
                  {list.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 scrollbar-thin">
                {list.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">Sin unidades en este estatus</p>
                ) : (
                  list.map((u) => (
                    <UnitCard
                      key={u.eco}
                      unit={u}
                      trips={col.id === 'cargado' ? (tripsByEco.get(u.eco) ?? []) : []}
                      onEdit={() => onEditUnit(u)}
                      onAssign={() => onNewTrip(u.eco)}
                      onToggleTaller={() =>
                        dispatch({ type: 'setUnitStatus', eco: u.eco, status: u.patioStatus === 'taller' ? 'disponible' : 'taller' })
                      }
                      onDelete={() => {
                        if (window.confirm(`¿Eliminar la unidad ECO ${u.eco} y sus viajes?`)) dispatch({ type: 'deleteUnit', eco: u.eco })
                      }}
                    />
                  ))
                )}
              </div>
            </Panel>
          )
        })}
      </div>
    </div>
  )
}

function UnitCard({
  unit,
  trips,
  onEdit,
  onAssign,
  onToggleTaller,
  onDelete,
}: {
  unit: Unit
  trips: Trip[]
  onEdit: () => void
  onAssign: () => void
  onToggleTaller: () => void
  onDelete: () => void
}) {
  const main = trips[0]
  const inTaller = unit.patioStatus === 'taller'
  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-background/60 p-4',
        main ? 'border-primary/40 border-t-4 border-t-primary/70 bg-primary/5' : 'border-border',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col items-start gap-2">
          <EcoBadge eco={unit.eco} prefix />
          {trips.map((t) => (
            <span key={t.id} className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
              VIAJE #{t.folio ?? '—'}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {main && (
            <span className="rounded border border-success/40 bg-success/10 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-success">
              ASIGNADA
            </span>
          )}
          <span className="rounded bg-secondary px-2 py-1 text-xs text-muted-foreground">{unit.kind}</span>
        </div>
      </div>
      <dl className="flex flex-col gap-1 text-sm">
        <div className="flex gap-1">
          <dt className="font-bold">Placas:</dt>
          <dd className="text-secondary-foreground">{unit.placas}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="font-bold">Capacidad:</dt>
          <dd className="text-primary">{unit.capacidad} m³</dd>
        </div>
        {main && (
          <>
            <div className="flex gap-1">
              <dt className="font-bold">Cajón / Rampa:</dt>
              <dd className="font-semibold text-success">{main.rampa || '—'}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="shrink-0 font-bold">Destino:</dt>
              <dd className="text-primary">{trips.map((t) => t.destino).join(' → ')}</dd>
            </div>
          </>
        )}
      </dl>
      {main && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
          <UserRound className="size-4 text-primary" aria-hidden />
          <div>
            <p className="font-mono text-[10px] font-bold tracking-wider text-primary uppercase">Operador asignado</p>
            <p className="text-sm font-bold uppercase">{main.operador}</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onToggleTaller}
          className={cn(
            'rounded border px-2 py-1 text-xs font-semibold',
            inTaller ? 'border-success/40 bg-success/10 text-success' : 'border-danger/40 bg-danger/10 text-danger',
          )}
        >
          {inTaller ? 'Disponible' : 'Taller'}
        </button>
        <div className="flex gap-1.5">
          {!inTaller && (
            <IconButton label={`Asignar viaje a ECO ${unit.eco}`} onClick={onAssign}>
              <Route />
            </IconButton>
          )}
          <IconButton label={`Editar ECO ${unit.eco}`} onClick={onEdit}>
            <Pencil />
          </IconButton>
          <IconButton label={`Eliminar ECO ${unit.eco}`} tone="danger" onClick={onDelete}>
            <Trash2 />
          </IconButton>
        </div>
      </div>
    </article>
  )
}
