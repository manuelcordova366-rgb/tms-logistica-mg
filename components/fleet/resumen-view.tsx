'use client'

import { useMemo, useState } from 'react'
import { Ban, CircleCheck, Navigation, Wrench, Sunrise, Tv } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFleet } from '@/lib/fleet-store'
import { formatPlanDate } from '@/lib/fleet-format'
import { FLEET_GROUP_LABEL, fleetGroupOf, type FleetGroup, type Trip, type Unit } from '@/lib/fleet-data'
import { IN_TRANSIT, SUP_RESUMEN } from '@/lib/fleet-status'
import { EcoBadge, EmptyRow, FilterChip, Panel, PlanChip, SearchField, StatusPill, type PillTone } from './primitives'
import { DestinationCell } from './destination-cell'

type KpiFilter = 'disponibles' | 'ruta' | 'taller' | 'manana' | 'cancelados' | null

interface Row {
  key: string
  unit: Unit
  trip?: Trip
  status: { label: string; tone: PillTone }
}

export function ResumenView() {
  const { units, trips, unitByEco, tripsByEco, planDate } = useFleet()
  const [kpi, setKpi] = useState<KpiFilter>(null)
  const [group, setGroup] = useState<FleetGroup | 'all'>('all')
  const [scope, setScope] = useState<'all' | 'LOCAL' | 'FORÁNEO'>('all')
  const [query, setQuery] = useState('')

  const stats = useMemo(() => {
    const free = units.filter((u) => u.patioStatus !== 'taller' && !tripsByEco.has(u.eco))
    const taller = units.filter((u) => u.patioStatus === 'taller')
    const enRuta = trips.filter((t) => IN_TRANSIT.includes(t.supStatus)).length
    const returning = new Set(trips.filter((t) => t.regresaManana).map((t) => t.eco))
    const cancelados = trips.filter((t) => t.supStatus === 'CANCELADO').length
    return { free: free.length, taller: taller.length, enRuta, returning: returning.size, cancelados }
  }, [units, trips, tripsByEco])

  const rows = useMemo<Row[]>(() => {
    const tripRows: Row[] = [...trips]
      .sort((a, b) => (a.folio ?? 999) - (b.folio ?? 999))
      .flatMap((trip) => {
        const unit = unitByEco.get(trip.eco)
        return unit ? [{ key: trip.id, unit, trip, status: SUP_RESUMEN[trip.supStatus] }] : []
      })
    const unitRows: Row[] = units
      .filter((u) => !tripsByEco.has(u.eco) || u.patioStatus === 'taller')
      .map((unit) => ({
        key: `unit-${unit.eco}`,
        unit,
        status:
          unit.patioStatus === 'taller'
            ? { label: 'TALLER', tone: 'danger' }
            : unit.patioStatus === 'colocado'
              ? { label: 'COLOCADO', tone: 'primary' }
              : { label: 'PROGRAMADO', tone: 'warning-outline' },
      }))
    return [...tripRows.slice(0, 2), ...unitRows, ...tripRows.slice(2)]
  }, [trips, units, unitByEco, tripsByEco])

  const filtered = rows.filter(({ unit, trip }) => {
    if (kpi === 'disponibles' && (trip || unit.patioStatus === 'taller')) return false
    if (kpi === 'ruta' && !(trip && IN_TRANSIT.includes(trip.supStatus))) return false
    if (kpi === 'taller' && unit.patioStatus !== 'taller') return false
    if (kpi === 'cancelados' && trip?.supStatus !== 'CANCELADO') return false
    if (kpi === 'manana' && !((!trip && unit.patioStatus !== 'taller') || trip?.regresaManana)) return false
    if (group !== 'all' && fleetGroupOf(unit.kind) !== group) return false
    if (scope !== 'all' && (trip?.kind ?? 'LOCAL') !== scope) return false
    if (query) {
      const hay = [unit.eco, unit.placas, trip?.operador, trip?.carga, trip?.destino, ...(trip?.entregas ?? [])].join(' ').toLowerCase()
      if (!hay.includes(query.toLowerCase())) return false
    }
    return true
  })

  const groupCounts = (g: FleetGroup) => {
    const list = units.filter((u) => fleetGroupOf(u.kind) === g)
    return { total: list.length, active: list.filter((u) => u.patioStatus !== 'taller').length }
  }

  const toggleKpi = (k: KpiFilter) => setKpi((cur) => (cur === k ? null : k))

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Disponibles patio" value={stats.free} icon={CircleCheck} tone="success" active={kpi === 'disponibles'} onClick={() => toggleKpi('disponibles')} />
        <KpiCard label="En ruta" value={stats.enRuta} icon={Navigation} tone="primary" active={kpi === 'ruta'} onClick={() => toggleKpi('ruta')} />
        <KpiCard label="En taller" value={stats.taller} icon={Wrench} tone="danger" active={kpi === 'taller'} onClick={() => toggleKpi('taller')} />
        <KpiCard
          label="Disponibles mañana"
          value={stats.free + stats.returning}
          icon={Sunrise}
          tone="violet"
          valueClass="text-success"
          active={kpi === 'manana'}
          onClick={() => toggleKpi('manana')}
          footnote={`${stats.free} libres · ${stats.returning} regresan mañana`}
        />
        <KpiCard
          label="Cancelados"
          value={stats.cancelados}
          icon={Ban}
          tone="danger"
          active={kpi === 'cancelados'}
          onClick={() => toggleKpi('cancelados')}
          footnote="Viajes cancelados del día"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Tipo de flota:</span>
        <FilterChip active={group === 'all'} onClick={() => setGroup('all')}>
          Todos ({units.length})
        </FilterChip>
        {(Object.keys(FLEET_GROUP_LABEL) as FleetGroup[]).map((g) => {
          const c = groupCounts(g)
          return (
            <FilterChip key={g} active={group === g} onClick={() => setGroup(g)}>
              {FLEET_GROUP_LABEL[g]} ({c.active} activas · {c.total} total)
            </FilterChip>
          )
        })}
      </div>

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Tv className="size-5 text-primary" aria-hidden />
              Flota y Embarques del Día ({filtered.length})
            </h2>
            <PlanChip label={formatPlanDate(planDate)} />
            <div className="flex flex-wrap gap-2">
              <FilterChip active={scope === 'all'} onClick={() => setScope('all')}>
                Todas
              </FilterChip>
              <FilterChip active={scope === 'LOCAL'} onClick={() => setScope('LOCAL')}>
                Locales
              </FilterChip>
              <FilterChip active={scope === 'FORÁNEO'} onClick={() => setScope('FORÁNEO')}>
                Foráneos (Rutas)
              </FilterChip>
            </div>
          </div>
          <SearchField
            aria-label="Buscar en resumen"
            placeholder="Buscar en resumen..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-64"
          />
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b-2 border-primary/60 text-left font-mono text-xs tracking-widest text-primary uppercase">
                <th scope="col" className="px-5 py-4 font-semibold">Viaje</th>
                <th scope="col" className="px-4 py-4 font-semibold">Eco unidad</th>
                <th scope="col" className="px-4 py-4 font-semibold">Operador</th>
                <th scope="col" className="px-4 py-4 font-semibold">Producto</th>
                <th scope="col" className="px-4 py-4 font-semibold">Destino &amp; ruta</th>
                <th scope="col" className="px-4 py-4 text-center font-semibold">Salida</th>
                <th scope="col" className="px-4 py-4 text-center font-semibold">ETA</th>
                <th scope="col" className="px-4 py-4 text-center font-semibold">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <EmptyRow colSpan={8}>Sin unidades con los filtros seleccionados</EmptyRow>}
              {filtered.map(({ key, unit, trip, status }) => (
                <tr key={key} className="border-b border-border/70 transition-colors hover:bg-accent/40">
                  <td className="px-5 py-4">
                    <span className="inline-flex size-7 items-center justify-center rounded bg-secondary font-mono font-bold">
                      {trip?.folio ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <EcoBadge eco={unit.eco} className="px-3 py-1.5 text-base" />
                  </td>
                  <td className="max-w-48 px-4 py-4">
                    <p className="font-semibold text-pretty uppercase">{trip?.operador ?? 'POR ASIGNAR'}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      Placas: {unit.placas} • Cap: {unit.capacidad} m³
                    </p>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs">{trip?.carga || '—'}</td>
                  <td className="px-4 py-4">
                    <DestinationCell trip={trip} />
                  </td>
                  <td className="px-4 py-4 text-center font-mono font-bold">{trip?.salida || '—'}</td>
                  <td className="px-4 py-4 text-center font-mono text-primary">{trip?.eta || '—'}</td>
                  <td className="px-4 py-4 text-center">
                    <StatusPill tone={status.tone}>{status.label}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

const KPI_TONES = {
  success: { bar: 'border-t-success', icon: 'bg-success/10 text-success border-success/30' },
  primary: { bar: 'border-t-primary', icon: 'bg-primary/10 text-primary border-primary/30' },
  danger: { bar: 'border-t-danger', icon: 'bg-danger/10 text-danger border-danger/30' },
  violet: { bar: 'border-t-violet', icon: 'bg-violet/10 text-success border-violet/30' },
} as const

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  active,
  onClick,
  footnote,
  valueClass,
}: {
  label: string
  value: number
  icon: typeof Wrench
  tone: keyof typeof KPI_TONES
  active: boolean
  onClick: () => void
  footnote?: string
  valueClass?: string
}) {
  const t = KPI_TONES[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex min-h-32 items-start justify-between gap-3 rounded-sm border border-t-4 border-border bg-card/85 p-5 text-left backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/40',
        t.bar,
        active && 'ring-2 ring-primary/60',
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold tracking-wider text-secondary-foreground uppercase">{label}</h3>
        <span className={cn('text-4xl font-extrabold tabular-nums', tone === 'danger' ? 'text-danger' : 'text-foreground', valueClass)}>
          {value}
        </span>
        {footnote && <span className="text-sm text-secondary-foreground">{footnote}</span>}
      </div>
      <span className={cn('flex size-12 items-center justify-center rounded-xl border', t.icon)}>
        <Icon className="size-6" aria-hidden />
      </span>
    </button>
  )
}
