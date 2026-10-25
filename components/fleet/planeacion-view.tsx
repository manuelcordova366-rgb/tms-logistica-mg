'use client'

import { Fragment, useMemo, useState } from 'react'
import { AlertTriangle, CalendarClock, ChevronDown, ChevronRight, CloudUpload, FileSpreadsheet, Layers, Pencil, Send, Trash2, Warehouse } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFleet } from '@/lib/fleet-store'
import { formatPlanDate } from '@/lib/fleet-format'
import type { PlanStatus, Trip, Unit } from '@/lib/fleet-data'
import { EcoBadge, EmptyRow, FilterChip, IconButton, KindTag, Panel, PlanChip, SearchField, StatusPill, type PillTone } from './primitives'

type RowStatus = PlanStatus | 'EN TALLER' | 'SIN UNIDAD'

interface PlanRow {
  key: string
  eco: string
  unit?: Unit
  trip?: Trip
  status: RowStatus
}

const STATUS_TONE: Record<RowStatus, PillTone> = {
  CARGADO: 'warning',
  COLOCADO: 'primary',
  PENDIENTE: 'muted',
  'NO SE CUBRE': 'danger',
  CANCELADO: 'danger',
  REPROGRAMADO: 'warning-outline',
  CONTINUACIÓN: 'violet',
  ANALIZANDO: 'primary',
  'HORAS DOT': 'warning-outline',
  'POR SALIR': 'success',
  'EN TALLER': 'danger',
  'SIN UNIDAD': 'warning-outline',
}

const FILTERS: { id: RowStatus; label: string }[] = [
  { id: 'SIN UNIDAD', label: 'SIN UNIDAD ASIGNADA' },
  { id: 'CARGADO', label: 'CARGADO' },
  { id: 'COLOCADO', label: 'COLOCADO' },
  { id: 'PENDIENTE', label: 'PENDIENTE' },
  { id: 'NO SE CUBRE', label: 'NO SE CUBRE' },
  { id: 'EN TALLER', label: 'EN TALLER' },
]



export function PlaneacionView({
  onNewTrip,
  onEditTrip,
  onEditUnit,
  onImport,
  onExport,
}: {
  onNewTrip: (eco?: string) => void
  onEditTrip: (trip: Trip) => void
  onEditUnit: (unit: Unit) => void
  onImport: () => void
  onExport: () => void
}) {
  const { units, trips, unitByEco, tripsByEco, planDate, dispatch } = useFleet()
  const [status, setStatus] = useState<RowStatus | 'all'>('all')
  const [kind, setKind] = useState<'all' | 'LOCAL' | 'FORÁNEO'>('all')
  const [query, setQuery] = useState('')
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [openStops, setOpenStops] = useState<Set<string>>(new Set())

  const rows = useMemo<PlanRow[]>(() => {
    const tripRows: PlanRow[] = trips.map((trip) => {
      const unit = unitByEco.get(trip.eco)
      const st: RowStatus = !unit ? 'SIN UNIDAD' : unit.patioStatus === 'taller' ? 'EN TALLER' : trip.planStatus
      return { key: trip.id, eco: trip.eco, unit, trip, status: st }
    })
    const unitRows: PlanRow[] = units
      .filter((u) => !tripsByEco.has(u.eco))
      .map((u) => ({
        key: `unit-${u.eco}`,
        eco: u.eco,
        unit: u,
        status: u.patioStatus === 'taller' ? 'EN TALLER' : u.noCubre ? 'NO SE CUBRE' : u.patioStatus === 'colocado' ? 'COLOCADO' : 'PENDIENTE',
      }))
    return [...tripRows, ...unitRows]
  }, [trips, units, unitByEco, tripsByEco])

  const count = (s: RowStatus) => rows.filter((r) => r.status === s).length
  const freeInPatio = units.filter((u) => u.patioStatus === 'disponible' && !tripsByEco.has(u.eco)).length

  const filtered = rows.filter((r) => {
    if (status !== 'all' && r.status !== status) return false
    if (kind !== 'all' && (r.trip?.kind ?? 'LOCAL') !== kind) return false
    if (query) {
      const hay = [r.eco, r.trip?.folio, r.trip?.operador, r.trip?.destino, r.trip?.pipa, r.trip?.carga].join(' ').toLowerCase()
      if (!hay.includes(query.toLowerCase())) return false
    }
    return true
  })

  const ordered = useMemo(() => {
    const multi = new Map<string, PlanRow[]>()
    const singles: PlanRow[] = []
    for (const r of filtered) {
      if (r.trip && (tripsByEco.get(r.eco)?.length ?? 0) > 1) {
        const list = multi.get(r.eco) ?? []
        list.push(r)
        multi.set(r.eco, list)
      } else singles.push(r)
    }
    for (const list of multi.values()) list.sort((a, b) => (a.trip?.folio ?? 999) - (b.trip?.folio ?? 999))
    const rank: Record<RowStatus, number> = {
      CARGADO: 0,
      COLOCADO: 1,
      'SIN UNIDAD': 2,
      PENDIENTE: 3,
      'POR SALIR': 4,
      CONTINUACIÓN: 5,
      REPROGRAMADO: 6,
      ANALIZANDO: 7,
      'HORAS DOT': 8,
      CANCELADO: 9,
      'NO SE CUBRE': 10,
      'EN TALLER': 11,
    }
    singles.sort((a, b) => rank[a.status] - rank[b.status] || (a.trip?.folio ?? 999) - (b.trip?.folio ?? 999))
    return { groups: [...multi.entries()], singles }
  }, [filtered, tripsByEco])

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, key: string) => {
    const next = new Set(set)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setter(next)
  }

  const [y, m, d] = planDate.split('-')

  return (
    <div className="flex flex-col gap-5">
      <Panel className="flex flex-col gap-4 border-l-4 border-l-primary p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-balance">
            <FileSpreadsheet className="size-6 text-primary" aria-hidden />
            Planeación de Embarques
          </h2>
          <span className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary">
            {`${d}/${m}/${y}`}
          </span>
        </div>
        <p className="text-sm text-secondary-foreground">Estatus oficial de embarque: COLOCADO, CARGADO y PENDIENTE con control de cargas y cortinas</p>
        <div className="flex flex-wrap items-stretch gap-3">
          <Stat label="Disponibles patio" value={freeInPatio} className="border-success/40 text-success" />
          <Stat label="Colocado" value={count('COLOCADO')} className="border-primary/40 text-primary" />
          <Stat label="Cargado" value={count('CARGADO')} className="border-warning/40 text-warning" />
          <Stat label="Pendiente" value={count('PENDIENTE')} className="border-border text-secondary-foreground" />
          <Stat label="En taller (bloqueadas)" value={count('EN TALLER')} className="border-danger/40 text-danger" />
          <button
            type="button"
            onClick={onImport}
            className="inline-flex items-center gap-2 rounded-xl border border-primary bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            <CloudUpload className="size-5" aria-hidden />
            Subir Planeación
          </button>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-xl border border-success bg-success/80 px-5 py-3 text-sm font-semibold text-background shadow-lg shadow-success/20 hover:bg-success"
          >
            <FileSpreadsheet className="size-5" aria-hidden />
            Exportar Excel Oficial
          </button>
        </div>
      </Panel>

      <Panel className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Estatus:</span>
          <FilterChip active={status === 'all'} onClick={() => setStatus('all')}>
            Todos ({rows.length} viajes)
          </FilterChip>
          {FILTERS.map((f) => (
            <FilterChip key={f.id} active={status === f.id} onClick={() => setStatus(f.id)}>
              {f.label} ({count(f.id)})
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Tipo viaje:</span>
          <FilterChip active={kind === 'all'} onClick={() => setKind('all')}>
            Todos
          </FilterChip>
          <FilterChip active={kind === 'LOCAL'} onClick={() => setKind('LOCAL')}>
            Local
          </FilterChip>
          <FilterChip active={kind === 'FORÁNEO'} onClick={() => setKind('FORÁNEO')}>
            Foráneo
          </FilterChip>
        </div>
        <SearchField
          aria-label="Buscar en planeación"
          placeholder="Buscar viaje, ECO, pipa, operador..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full md:w-80"
        />
      </Panel>

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <CalendarClock className="size-5 text-primary" aria-hidden />
              Matriz de Embarques y Despacho ({filtered.length} Viajes)
            </h2>
            <PlanChip label={formatPlanDate(planDate)} />
          </div>
          <p className="text-sm text-secondary-foreground">Estatus Oficial: COLOCADO, CARGADO, PENDIENTE (Sincronizado en tiempo real)</p>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1140px] text-sm">
            <thead>
              <tr className="border-b-2 border-primary/60 text-left font-mono text-xs tracking-widest text-primary uppercase">
                <th scope="col" className="px-4 py-4 font-semibold">Eco unidad</th>
                <th scope="col" className="px-3 py-4 font-semibold">Cap.</th>
                <th scope="col" className="px-3 py-4 font-semibold">Operador</th>
                <th scope="col" className="px-3 py-4 font-semibold">Producto</th>
                <th scope="col" className="px-3 py-4 font-semibold">Sucursal / destino</th>
                <th scope="col" className="px-3 py-4 font-semibold">Tipo</th>
                <th scope="col" className="px-3 py-4 text-center font-semibold">Estatus</th>
                <th scope="col" className="px-3 py-4 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <EmptyRow colSpan={8}>Sin viajes con los filtros seleccionados</EmptyRow>}
              {ordered.groups.map(([eco, list]) => {
                const open = openGroups.has(eco)
                return (
                  <Fragment key={`g-${eco}`}>
                    <tr>
                      <td colSpan={8} className="p-2">
                        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
                          <button
                            type="button"
                            aria-expanded={open}
                            aria-label={open ? `Ocultar viajes de ECO ${eco}` : `Mostrar viajes de ECO ${eco}`}
                            onClick={() => toggle(openGroups, setOpenGroups, eco)}
                            className="flex size-7 items-center justify-center rounded-full border border-primary/40 text-primary"
                          >
                            {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                          </button>
                          <EcoBadge eco={eco} prefix className="px-4 py-1.5 text-base tracking-wider" />
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                            <Layers className="size-3.5" aria-hidden />
                            {list.length} Viajes Programados
                          </span>
                          <span className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                            Folios: <span className="font-mono font-bold text-primary">{list.map((r) => `#${r.trip?.folio ?? '—'}`).join(' · ')}</span>
                          </span>
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">Secuencia:</span>
                            <div className="flex flex-wrap items-center gap-1">
                              {list.map((r, i) => (
                                <Fragment key={r.key}>
                                  {i > 0 && <ChevronRight className="size-3 text-muted-foreground" aria-hidden />}
                                  <span className="rounded border border-border bg-background px-2 py-0.5 text-xs font-semibold">{r.trip?.destino}</span>
                                </Fragment>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggle(openGroups, setOpenGroups, eco)}
                            className="ml-auto rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                          >
                            {open ? '▲ Ocultar Desglose' : '▼ Ver Desglose de Viajes'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {open &&
                      list.map((r) => (
                        <PlanRowView key={r.key} row={r} openStops={openStops} onToggleStops={(k) => toggle(openStops, setOpenStops, k)} {...{ dispatch, onEditTrip, onEditUnit, onNewTrip }} />
                      ))}
                  </Fragment>
                )
              })}
              {ordered.singles.map((r) => (
                <PlanRowView key={r.key} row={r} openStops={openStops} onToggleStops={(k) => toggle(openStops, setOpenStops, k)} {...{ dispatch, onEditTrip, onEditUnit, onNewTrip }} />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

function Stat({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={cn('flex min-w-24 flex-col items-center justify-center gap-1 rounded-xl border bg-background/50 px-3 py-3', className)}>
      <span className="text-[11px] font-semibold tracking-wide uppercase">{label}</span>
      <span className="font-mono text-xl font-bold">{value}</span>
    </div>
  )
}

function PlanRowView({
  row,
  openStops,
  onToggleStops,
  dispatch,
  onEditTrip,
  onEditUnit,
  onNewTrip,
}: {
  row: PlanRow
  openStops: Set<string>
  onToggleStops: (key: string) => void
  dispatch: ReturnType<typeof useFleet>['dispatch']
  onEditTrip: (trip: Trip) => void
  onEditUnit: (unit: Unit) => void
  onNewTrip: (eco?: string) => void
}) {
  const { trip, unit, status } = row
  const stopsOpen = openStops.has(row.key)
  return (
    <>
      <tr className={cn('border-b border-border/70 transition-colors hover:bg-accent/40', status === 'CARGADO' && 'bg-secondary/40')}>
        <td className={cn('border-l-4 px-4 py-4', status === 'CARGADO' ? 'border-l-warning' : 'border-l-transparent')}>
          <EcoBadge eco={row.eco} />
        </td>
        <td className="px-3 py-4 font-mono font-bold">{unit?.capacidad ?? '—'}</td>
        <td className="max-w-40 px-3 py-4">
          {trip && trip.operador !== 'POR ASIGNAR' ? (
            <span className="font-semibold uppercase">{trip.operador}</span>
          ) : (
            <span className="text-muted-foreground italic">Por Asignar</span>
          )}
        </td>
        <td className="px-3 py-4">
          <span className="rounded bg-secondary px-2 py-1 font-mono text-xs">{trip?.carga || '—'}</span>
        </td>
        <td className="max-w-56 px-3 py-4">
          <div className="flex flex-col items-start gap-1.5">
            <span className="font-semibold text-pretty">{trip?.destino ?? 'Sin destino'}</span>
            {trip && trip.entregas.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                <Layers className="size-3" aria-hidden />
                {trip.entregas.length + 1} Entregas
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-4">
          <KindTag kind={trip?.kind ?? 'LOCAL'} />
        </td>
        <td className="px-3 py-4 text-center">
          <StatusPill tone={STATUS_TONE[status]}>{status === 'SIN UNIDAD' ? 'SIN UNIDAD' : status}</StatusPill>
        </td>
        <td className="px-3 py-4">
          <div className="flex items-center justify-end gap-1.5">
            <RowActions row={row} dispatch={dispatch} onNewTrip={onNewTrip} />
            <IconButton
              label="Editar"
              onClick={() => (trip ? onEditTrip(trip) : unit && onEditUnit(unit))}
            >
              <Pencil />
            </IconButton>
            <IconButton
              label="Eliminar"
              tone="danger"
              onClick={() => {
                if (trip) {
                  if (window.confirm(`¿Eliminar el viaje #${trip.folio ?? '—'} (${trip.destino})?`)) dispatch({ type: 'deleteTrip', id: trip.id })
                } else if (unit && window.confirm(`¿Eliminar la unidad ECO ${unit.eco}?`)) dispatch({ type: 'deleteUnit', eco: unit.eco })
              }}
            >
              <Trash2 />
            </IconButton>
          </div>
        </td>
      </tr>
      {trip && trip.entregas.length > 0 && (
        <tr className="border-b border-border/70 bg-background/40">
          <td colSpan={8} className="px-4 py-1.5">
            <button
              type="button"
              aria-expanded={stopsOpen}
              onClick={() => onToggleStops(row.key)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              {stopsOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              {trip.entregas.length} paradas adicionales
            </button>
            {stopsOpen && (
              <ol className="mt-2 mb-1 flex flex-wrap gap-2 pl-5">
                {trip.entregas.map((stop, i) => (
                  <li key={`${stop}-${i}`} className="rounded border border-border bg-secondary px-2 py-1 text-xs">
                    <span className="mr-1 font-mono text-muted-foreground">{i + 2}.</span>
                    {stop}
                  </li>
                ))}
              </ol>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

function RowActions({
  row,
  dispatch,
  onNewTrip,
}: {
  row: PlanRow
  dispatch: ReturnType<typeof useFleet>['dispatch']
  onNewTrip: (eco?: string) => void
}) {
  const { trip, unit, status } = row

  if (status === 'EN TALLER') return <span className="pr-2 text-xs text-danger italic">Bloqueada</span>

  if (trip) {
    if (status === 'CARGADO')
      return (
        <span className="inline-flex items-center gap-1 pr-2 text-xs text-warning italic">
          <Send className="size-3" aria-hidden />
          Listo p/ Salida
        </span>
      )
    const next = status === 'COLOCADO' ? 'CARGADO' : 'COLOCADO'
    return (
      <button
        type="button"
        onClick={() => dispatch({ type: 'upsertTrip', trip: { ...trip, planStatus: next } })}
        className="rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
      >
        {status === 'COLOCADO' ? 'Marcar Cargado' : 'Colocar'}
      </button>
    )
  }

  if (!unit) return null

  if (status === 'NO SE CUBRE')
    return (
      <button
        type="button"
        onClick={() => dispatch({ type: 'toggleNoCubre', eco: unit.eco })}
        className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground"
      >
        Reactivar
      </button>
    )

  if (status === 'COLOCADO')
    return (
      <>
        <button
          type="button"
          onClick={() => onNewTrip(unit.eco)}
          className="rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
        >
          Asignar viaje
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'setUnitStatus', eco: unit.eco, status: 'disponible' })}
          className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
        >
          Quitar
        </button>
      </>
    )

  return (
    <>
      <button
        type="button"
        onClick={() => dispatch({ type: 'setUnitStatus', eco: unit.eco, status: 'colocado' })}
        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-muted-foreground/50 bg-secondary/60 px-2.5 py-1 text-xs text-secondary-foreground hover:text-foreground"
      >
        <Warehouse className="size-3.5" aria-hidden />
        Colocar
        <AlertTriangle className="size-3 text-warning" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: 'toggleNoCubre', eco: unit.eco })}
        className="rounded-lg border border-danger/50 bg-danger/10 px-2 py-0.5 text-xs leading-tight font-semibold text-danger"
      >
        No
        <br />
        Cubre
      </button>
    </>
  )
}
