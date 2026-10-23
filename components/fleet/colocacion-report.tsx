'use client'

import type { ReactNode, Ref } from 'react'
import Image from 'next/image'
import { CalendarDays, CircleAlert, CircleCheck, Boxes, MapPin, Package, TrendingUp, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFleet } from '@/lib/fleet-store'
import { formatLongDate, shiftISODate } from '@/lib/fleet-format'
import { COLOCACION_EJECUTADAS, FLEET_GROUP_LABEL, HEADCOUNT, MOVIMIENTOS_LABELS, fleetGroupOf, type FleetGroup } from '@/lib/fleet-data'

export interface DayData {
  movimientos: number[]
  ppe: number
  com: number
  pendientes: { folio: string; m3: number; obs: string }[]
  observaciones: string
}

const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0)
const pctLabel = (v: number) => `${v.toFixed(1)}%`

function PctBadge({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const good = value >= 95
  const mid = value >= 85
  return (
    <span
      className={cn(
        'inline-block rounded px-1.5 py-0.5 font-mono text-xs font-bold',
        inverse
          ? 'bg-sheet/15 text-sheet'
          : good
            ? 'bg-sheet-green-soft text-sheet-green'
            : mid
              ? 'bg-warning/25 text-sheet-foreground'
              : 'bg-danger/15 text-danger',
      )}
    >
      {pctLabel(value)}
    </span>
  )
}

function SectionTitle({ children, className }: { children: ReactNode; className: string }) {
  return <h3 className={cn('px-4 py-2 text-center text-sm font-extrabold tracking-wide text-sheet uppercase', className)}>{children}</h3>
}

function Num({ v }: { v: number }) {
  return <span className={cn('font-bold', v < 0 ? 'text-danger' : 'text-sheet-foreground')}>{v}</span>
}

export function ColocacionReport({ ref, date, day }: { ref: Ref<HTMLDivElement>; date: string; day: DayData }) {
  const { units, tripsByEco, trips } = useFleet()
  const ejecutadas = COLOCACION_EJECUTADAS.length
  const pendientes = day.pendientes.length
  const plan = ejecutadas + pendientes
  const metros = COLOCACION_EJECUTADAS.reduce((s, r) => s + r.capacidad, 0)
  const tomorrow = shiftISODate(date, 1)
  const [, tm, td] = tomorrow.split('-')
  const freeUnits = units.filter((u) => u.patioStatus !== 'taller' && !tripsByEco.has(u.eco)).length
  const returning = new Set(trips.filter((t) => t.regresaManana).map((t) => t.eco)).size
  const planSiguiente = freeUnits + returning
  const totalPiezas = day.movimientos.reduce((s, n) => s + n, 0)

  const parque = (Object.keys(FLEET_GROUP_LABEL) as FleetGroup[]).map((g) => {
    const list = units.filter((u) => fleetGroupOf(u.kind) === g)
    const taller = list.filter((u) => u.patioStatus === 'taller').length
    return { label: FLEET_GROUP_LABEL[g], total: list.length, taller, activas: list.length - taller }
  })
  const parqueTotal = parque.reduce((a, p) => ({ total: a.total + p.total, taller: a.taller + p.taller, activas: a.activas + p.activas }), {
    total: 0,
    taller: 0,
    activas: 0,
  })

  const hc = HEADCOUNT.map((r) => ({
    ...r,
    vacantes: r.activo - r.autorizado,
    pctHc: pct(r.activo - r.incapacidades - r.vacaciones - r.faltas, r.autorizado),
    pctActivo: pct(r.activo, r.autorizado),
  }))
  const hcTotal = HEADCOUNT.reduce(
    (a, r) => ({
      autorizado: a.autorizado + r.autorizado,
      activo: a.activo + r.activo,
      incapacidades: a.incapacidades + r.incapacidades,
      vacaciones: a.vacaciones + r.vacaciones,
      faltas: a.faltas + r.faltas,
    }),
    { autorizado: 0, activo: 0, incapacidades: 0, vacaciones: 0, faltas: 0 },
  )

  const kpis = [
    { label: 'Plan programado', value: plan, unit: 'cargas', icon: CalendarDays, cls: 'bg-sheet-navy border-sheet-navy' },
    { label: 'Cargas ejecutadas', value: ejecutadas, icon: Truck, cls: 'bg-sheet-green border-sheet-green' },
    { label: 'Pendientes', value: pendientes, icon: CircleAlert, cls: 'bg-sheet-magenta border-sheet-magenta' },
    { label: 'Cumplimiento', value: `${Math.round(pct(ejecutadas, plan))}%`, icon: TrendingUp, cls: 'bg-sheet-purple border-sheet-purple' },
    { label: 'Metros remisionados', value: metros, unit: 'm³', icon: Boxes, cls: 'bg-sheet-teal border-sheet-teal' },
    { label: `Plan ${td}/${tm}`, value: planSiguiente, unit: 'unidades', icon: CalendarDays, cls: 'bg-sheet-navy border-sheet-navy' },
  ]

  return (
    <div ref={ref} className="w-full min-w-[1080px] bg-sheet p-4 font-sans text-sheet-foreground">
      <header className="flex items-center justify-between gap-6 bg-sheet-navy px-6 py-4">
        <div className="flex h-20 w-56 items-center justify-center rounded-lg bg-sheet px-4">
          <Image src="/logistica-mg-logo-mark.png" alt="Logística M&G TMS" width={525} height={355} unoptimized className="h-full w-auto py-1" />
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-3xl leading-tight font-extrabold text-sheet text-balance">
            PLAN DE COLOCACIÓN
            <br />
            VILLAHERMOSA
          </h2>
          <p className="flex items-center gap-4 rounded-md bg-sheet px-5 py-1.5 text-base font-bold text-sheet-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4 text-sheet-magenta" aria-hidden />
              {formatLongDate(date)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 text-sheet-magenta" aria-hidden />
              VILLAHERMOSA
            </span>
          </p>
        </div>
        <Image
          src="/cedis-patio-trucks-header.png"
          alt="Tractocamiones BAZ Entregas en el patio del CEDIS"
          width={740}
          height={320}
          unoptimized
          className="h-40 w-80 rounded-lg border-2 border-sheet object-cover"
        />
      </header>

      <div className="mt-3 grid grid-cols-6 gap-2.5">
        {kpis.map(({ label, value, unit, icon: Icon, cls }) => (
          <div key={label} className={cn('overflow-hidden rounded-lg border-2', cls)}>
            <p className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-sheet">
              <Icon className="size-3.5" aria-hidden />
              {label}
            </p>
            <p className="bg-sheet px-2.5 py-1.5 text-center">
              <span className="text-3xl font-extrabold">{value}</span>
              {unit && <span className="ml-1 text-sm font-bold text-sheet-foreground/70">{unit}</span>}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-[1.45fr_1fr] gap-3">
        <div className="flex flex-col gap-3">
          <section className="overflow-hidden rounded-lg border border-sheet-green">
            <SectionTitle className="bg-sheet-green">1. Resumen de cargas ejecutadas – {formatLongDate(date)}</SectionTitle>
            <table className="w-full text-sm">
              <thead className="bg-sheet-green-soft text-xs font-bold uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Destino / Operación</th>
                  <th className="px-2 py-2">Tipo</th>
                  <th className="px-2 py-2">Capacidad</th>
                  <th className="px-2 py-2">Línea</th>
                  <th className="px-2 py-2">Estatus</th>
                </tr>
              </thead>
              <tbody>
                {COLOCACION_EJECUTADAS.map((r, i) => (
                  <tr key={r.destino} className={cn('border-t border-sheet-muted', i % 2 === 1 && 'bg-sheet-green-soft/30')}>
                    <td className="border-r border-sheet-muted px-3 py-1.5 font-semibold">{r.destino}</td>
                    <td className="border-r border-sheet-muted px-2 py-1.5 text-center text-sheet-foreground/70">{r.tipo}</td>
                    <td className="border-r border-sheet-muted px-2 py-1.5 text-center font-bold">{r.capacidad} m³</td>
                    <td className="border-r border-sheet-muted px-2 py-1.5 text-center font-semibold">{r.linea}</td>
                    <td className="px-2 py-1.5 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-sheet-green px-2 py-0.5 text-xs font-bold text-sheet">
                        <CircleCheck className="size-3" aria-hidden />
                        Ejecutada
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="overflow-hidden rounded-lg border border-sheet-navy">
            <SectionTitle className="bg-sheet-navy">5. Plantilla / Headcount</SectionTitle>
            <table className="w-full text-sm">
              <thead className="bg-sheet-muted text-[11px] font-bold uppercase">
                <tr>
                  <th className="px-2 py-2 text-left">Puesto / Rol</th>
                  <th className="px-1 py-2">HC autorizado</th>
                  <th className="px-1 py-2">HC activo</th>
                  <th className="px-1 py-2">Vacantes</th>
                  <th className="px-1 py-2">% HC autorizado</th>
                  <th className="px-1 py-2">Incapacidades</th>
                  <th className="px-1 py-2">Vacaciones</th>
                  <th className="px-1 py-2">Faltas</th>
                  <th className="px-1 py-2">% Total activo</th>
                </tr>
              </thead>
              <tbody>
                {hc.map((r) => (
                  <tr key={r.rol} className="border-t border-sheet-muted text-center">
                    <td className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">{r.rol}</td>
                    <td className="px-1 py-1.5 font-bold">{r.autorizado}</td>
                    <td className="px-1 py-1.5 font-bold">{r.activo}</td>
                    <td className="px-1 py-1.5">
                      <Num v={r.vacantes} />
                    </td>
                    <td className="px-1 py-1.5">
                      <PctBadge value={r.pctHc} />
                    </td>
                    <td className="px-1 py-1.5">
                      <Num v={-r.incapacidades} />
                    </td>
                    <td className="px-1 py-1.5">
                      <Num v={-r.vacaciones} />
                    </td>
                    <td className="px-1 py-1.5">
                      <Num v={-r.faltas} />
                    </td>
                    <td className="px-1 py-1.5">
                      <PctBadge value={r.pctActivo} />
                    </td>
                  </tr>
                ))}
                <tr className="bg-sheet-navy text-center font-bold text-sheet">
                  <td className="px-2 py-2 text-left">TOTAL PLANTILLA</td>
                  <td>{hcTotal.autorizado}</td>
                  <td>{hcTotal.activo}</td>
                  <td>{hcTotal.activo - hcTotal.autorizado}</td>
                  <td>
                    <PctBadge
                      inverse
                      value={pct(hcTotal.activo - hcTotal.incapacidades - hcTotal.vacaciones - hcTotal.faltas, hcTotal.autorizado)}
                    />
                  </td>
                  <td>{-hcTotal.incapacidades}</td>
                  <td>{-hcTotal.vacaciones}</td>
                  <td>{-hcTotal.faltas}</td>
                  <td>
                    <PctBadge inverse value={pct(hcTotal.activo, hcTotal.autorizado)} />
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="overflow-hidden rounded-lg border border-sheet-green">
            <SectionTitle className="bg-sheet-green">6. Parque vehicular (PV activo)</SectionTitle>
            <table className="w-full text-sm">
              <thead className="bg-sheet-green-soft text-xs font-bold uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Tipo de unidad</th>
                  <th className="px-2 py-2">Total flota</th>
                  <th className="px-2 py-2">- Taller</th>
                  <th className="px-2 py-2">Activas</th>
                  <th className="px-2 py-2">% Activo</th>
                </tr>
              </thead>
              <tbody>
                {parque.map((p) => (
                  <tr key={p.label} className="border-t border-sheet-muted text-center">
                    <td className="px-3 py-1.5 text-left font-semibold">{p.label}</td>
                    <td className="font-bold">{p.total}</td>
                    <td className={cn('font-bold', p.taller > 0 ? 'text-danger' : 'text-sheet-green')}>{p.taller > 0 ? `-${p.taller}` : 0}</td>
                    <td className="font-bold">{p.activas}</td>
                    <td className="py-1.5">
                      <PctBadge value={pct(p.activas, p.total)} />
                    </td>
                  </tr>
                ))}
                <tr className="bg-sheet-green text-center font-bold text-sheet">
                  <td className="px-3 py-2">TOTAL FLOTA</td>
                  <td>{parqueTotal.total}</td>
                  <td>-{parqueTotal.taller}</td>
                  <td>{parqueTotal.activas}</td>
                  <td>
                    <PctBadge inverse value={pct(parqueTotal.activas, parqueTotal.total)} />
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        <div className="flex flex-col gap-3">
          <section className="overflow-hidden rounded-lg border border-sheet-navy">
            <SectionTitle className="bg-sheet-navy">2. Movimientos y piezas del día</SectionTitle>
            <div className="flex">
              <table className="flex-1 text-sm">
                <tbody>
                  {MOVIMIENTOS_LABELS.map((label, i) => (
                    <tr key={label} className={cn('border-b border-sheet-muted', i % 2 === 1 && 'bg-sheet-muted/60')}>
                      <td className="border-r border-sheet-muted px-3 py-1.5 font-semibold">{label}</td>
                      <td className="px-3 py-1.5 text-right font-bold">{day.movimientos[i]}</td>
                    </tr>
                  ))}
                  <tr className="bg-sheet-navy font-bold text-sheet">
                    <td className="px-3 py-2 text-right">TOTAL:</td>
                    <td className="px-3 py-2 text-right">{totalPiezas} piezas</td>
                  </tr>
                </tbody>
              </table>
              <div className="flex w-32 flex-col justify-center gap-2 border-l border-sheet-muted p-2">
                {[
                  { label: 'PPE', value: day.ppe },
                  { label: '.COM', value: day.com },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2 rounded-lg border border-sheet-muted px-2 py-2 shadow-sm">
                    <Package className="size-7 text-warning" aria-hidden />
                    <div className="leading-tight">
                      <p className="text-xs font-bold">{b.label}</p>
                      <p className="text-xl font-extrabold">{b.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg bg-sheet-purple text-sheet">
            <SectionTitle className="bg-sheet-purple">3. Comportamiento diario asignado vs remisionado</SectionTitle>
            <div className="flex items-center gap-4 px-4 pt-1 pb-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-sheet/15">
                <TrendingUp className="size-7" aria-hidden />
              </span>
              <dl className="grid flex-1 grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-sm">
                <dt className="font-semibold">Promedio Diario Asignado a FC:</dt>
                <dd className="text-right font-extrabold">{plan} cargas</dd>
                <dt className="font-semibold">Promedio Diario Operado:</dt>
                <dd className="text-right font-extrabold">{ejecutadas} cargas</dd>
                <dt className="font-semibold">Remisionado Acumulado:</dt>
                <dd className="text-right font-extrabold">{metros} m³</dd>
              </dl>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-sheet-green">
            <SectionTitle className="bg-sheet-green">4. Cargas pendientes / escalonadas</SectionTitle>
            <table className="w-full text-sm">
              <thead className="bg-sheet-green-soft font-bold uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Folio / Destino</th>
                  <th className="px-2 py-2">M³</th>
                  <th className="px-3 py-2 text-left">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {day.pendientes.length === 0 ? (
                  <tr className="bg-sheet-muted/60">
                    <td className="px-3 py-2 font-bold text-sheet-green">Sin cargas pendientes</td>
                    <td className="px-2 py-2 text-center">–</td>
                    <td />
                  </tr>
                ) : (
                  day.pendientes.map((p, i) => (
                    <tr key={`${p.folio}-${i}`} className="border-t border-sheet-muted">
                      <td className="px-3 py-1.5 font-semibold">{p.folio}</td>
                      <td className="px-2 py-1.5 text-center font-bold">{p.m3}</td>
                      <td className="px-3 py-1.5 text-sheet-foreground/70">{p.obs}</td>
                    </tr>
                  ))
                )}
                <tr className="bg-sheet-green font-bold text-sheet">
                  <td className="px-3 py-2">TOTAL PENDIENTES:</td>
                  <td colSpan={2} className="px-2 py-2">
                    {pendientes} cargas
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>

      <p className="mt-3 border-t border-sheet-muted bg-sheet-muted/50 px-3 py-2 text-sm">
        <span className="mr-2 font-extrabold text-sheet-teal">OBSERVACIONES:</span>
        {day.observaciones || 'Sin observaciones.'}
      </p>
    </div>
  )
}
