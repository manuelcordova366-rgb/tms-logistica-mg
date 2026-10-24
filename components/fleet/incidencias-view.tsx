'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFleet } from '@/lib/fleet-store'
import { formatPlanDate, shiftISODate, toISODate } from '@/lib/fleet-format'
import { INCIDENCIA_LABEL, INCIDENCIA_TIPOS, OPERADORES, type IncidenciaTipo } from '@/lib/fleet-data'
import { EmptyRow, Panel, SearchField } from './primitives'

/** El rol siempre se captura de lunes a domingo. */
const DAY_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

const TONE: Record<IncidenciaTipo, string> = {
  ASISTENCIA: 'border-success/40 bg-success/10 text-success',
  FALTA: 'border-danger/40 bg-danger/10 text-danger',
  INCAPACIDAD: 'border-warning/40 bg-warning/10 text-warning',
  PERMISO: 'border-primary/40 bg-primary/10 text-primary',
  TRASLADO: 'border-violet/40 bg-violet/10 text-violet',
  VACACIONES: 'border-border bg-secondary text-secondary-foreground',
}

const registroKey = (fecha: string, operador: string) => `${fecha}|${operador}`

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

/** Lunes de la semana que contiene la fecha. */
function mondayOf(iso: string) {
  const date = new Date(`${iso}T12:00:00`)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return toISODate(date)
}

export function IncidenciasView() {
  const { planDate, incidencias, dispatch } = useFleet()
  const [weekStart, setWeekStart] = useState(() => mondayOf(planDate))
  const [query, setQuery] = useState('')

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => shiftISODate(weekStart, i)), [weekStart])
  const operadores = useMemo(() => {
    const q = normalize(query)
    return q ? OPERADORES.filter((nombre) => normalize(nombre).includes(q)) : OPERADORES
  }, [query])

  const tipoDe = (fecha: string, operador: string): IncidenciaTipo => incidencias[registroKey(fecha, operador)] ?? 'ASISTENCIA'

  const totales = useMemo(() => {
    const counts = Object.fromEntries(INCIDENCIA_TIPOS.map((tipo) => [tipo, 0])) as Record<IncidenciaTipo, number>
    for (const operador of operadores) for (const fecha of days) counts[tipoDe(fecha, operador)] += 1
    return counts
  }, [operadores, days, incidencias]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-5">
      <Panel className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Semana anterior"
              onClick={() => setWeekStart(shiftISODate(weekStart, -7))}
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-secondary-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 font-mono text-xs text-primary">
              <CalendarDays className="size-4" aria-hidden />
              {formatPlanDate(days[0])} — {formatPlanDate(days[6])}
            </span>
            <button
              type="button"
              aria-label="Semana siguiente"
              onClick={() => setWeekStart(shiftISODate(weekStart, 7))}
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-secondary text-secondary-foreground hover:text-foreground"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setWeekStart(mondayOf(planDate))}
              className="h-10 rounded-lg border border-border bg-secondary px-4 text-sm font-semibold hover:text-foreground"
            >
              Semana del plan
            </button>
          </div>
          <SearchField
            aria-label="Buscar operador"
            placeholder="Buscar por nombre de operador..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-80"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {INCIDENCIA_TIPOS.map((tipo) => (
            <div key={tipo} className={cn('rounded-xl border px-4 py-3', TONE[tipo])}>
              <p className="text-[11px] font-bold tracking-wider uppercase">{INCIDENCIA_LABEL[tipo]}</p>
              <p className="text-2xl font-extrabold tabular-nums">{totales[tipo]}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ClipboardList className="size-5 text-primary" aria-hidden />
            Rol de Incidencias ({operadores.length} operadores)
          </h2>
          <p className="text-xs text-muted-foreground">
            Registro semanal de lunes a domingo: asistencias, faltas, incapacidades, permisos, traslados y vacaciones.
          </p>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="border-b-2 border-primary/60 text-left font-mono text-xs tracking-widest text-primary uppercase">
                <th scope="col" className="px-5 py-4 font-semibold">
                  Operador
                </th>
                {days.map((fecha, i) => (
                  <th key={fecha} scope="col" className="px-2 py-4 text-center font-semibold">
                    {DAY_LABELS[i]} <span className="text-muted-foreground">{fecha.slice(8, 10)}</span>
                  </th>
                ))}
                <th scope="col" className="px-4 py-4 text-center font-semibold">
                  Incidencias
                </th>
              </tr>
            </thead>
            <tbody>
              {operadores.length === 0 && (
                <EmptyRow colSpan={9}>{query ? 'Sin operadores que coincidan con la búsqueda' : 'Sin operadores registrados en el rol'}</EmptyRow>
              )}
              {operadores.map((operador) => {
                const incidenciasSemana = days.filter((fecha) => tipoDe(fecha, operador) !== 'ASISTENCIA').length
                return (
                  <tr key={operador} className="border-b border-border/70 transition-colors hover:bg-accent/40">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 font-semibold uppercase">
                        <UserRound className="size-4 text-muted-foreground" aria-hidden />
                        {operador}
                      </span>
                    </td>
                    {days.map((fecha, i) => {
                      const tipo = tipoDe(fecha, operador)
                      return (
                        <td key={fecha} className="px-2 py-3">
                          <select
                            aria-label={`${operador} ${DAY_LABELS[i]}`}
                            value={tipo}
                            onChange={(e) => dispatch({ type: 'setIncidencia', key: registroKey(fecha, operador), tipo: e.target.value as IncidenciaTipo })}
                            className={cn('h-9 w-full min-w-32 rounded-lg border px-2 text-xs font-bold uppercase', TONE[tipo])}
                          >
                            {INCIDENCIA_TIPOS.map((option) => (
                              <option key={option} value={option} className="bg-background text-foreground">
                                {INCIDENCIA_LABEL[option]}
                              </option>
                            ))}
                          </select>
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex min-w-10 justify-center rounded-full border px-2 py-1 font-mono text-sm font-bold',
                          incidenciasSemana > 0 ? 'border-warning/40 bg-warning/10 text-warning' : 'border-border bg-secondary text-muted-foreground',
                        )}
                      >
                        {incidenciasSemana}
                      </span>
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
