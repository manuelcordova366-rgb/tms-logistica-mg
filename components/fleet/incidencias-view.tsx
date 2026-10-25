'use client'

import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, CloudUpload, FileDown, Plus, Trash2, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFleet } from '@/lib/fleet-store'
import { downloadCsv, formatPlanDate, parseCsv, shiftISODate, toISODate } from '@/lib/fleet-format'
import { INCIDENCIA_LABEL, INCIDENCIA_TIPOS, type IncidenciaTipo } from '@/lib/fleet-data'
import { EmptyRow, IconButton, Panel, SearchField } from './primitives'

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
  const { planDate, incidencias, operadores, dispatch } = useFleet()
  const [weekStart, setWeekStart] = useState(() => mondayOf(planDate))
  const [query, setQuery] = useState('')
  const [nombre, setNombre] = useState('')
  const [notice, setNotice] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => shiftISODate(weekStart, i)), [weekStart])
  const visibles = useMemo(() => {
    const q = normalize(query)
    return q ? operadores.filter((operador) => normalize(operador).includes(q)) : operadores
  }, [query, operadores])

  const tipoDe = (fecha: string, operador: string): IncidenciaTipo => incidencias[registroKey(fecha, operador)] ?? 'ASISTENCIA'

  const totales = useMemo(() => {
    const counts = Object.fromEntries(INCIDENCIA_TIPOS.map((tipo) => [tipo, 0])) as Record<IncidenciaTipo, number>
    for (const operador of visibles) for (const fecha of days) counts[tipoDe(fecha, operador)] += 1
    return counts
  }, [visibles, days, incidencias]) // eslint-disable-line react-hooks/exhaustive-deps

  const agregarOperador = () => {
    const limpio = nombre.trim()
    if (!limpio) return
    dispatch({ type: 'addOperador', nombre: limpio })
    setNombre('')
    setNotice(`${limpio.toUpperCase()} se agregó a la plantilla del rol`)
  }

  /** Plantilla sencilla (una columna) para llenar en Excel y subir el rol completo. */
  const downloadTemplate = () => downloadCsv('plantilla-operadores.csv', ['OPERADOR'], [])

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/\.csv$/i.test(file.name)) {
      setNotice('Guarda la plantilla de Excel como CSV (.csv) para subirla')
      return
    }
    const rows = parseCsv(await file.text())
    const nombres = rows.map((row) => (row.operador || row.nombre || Object.values(row)[0] || '').trim()).filter(Boolean)
    if (nombres.length === 0) {
      setNotice('No se encontraron nombres: la plantilla necesita la columna OPERADOR')
      return
    }
    dispatch({ type: 'importOperadores', nombres })
    setNotice(`${nombres.length} operadores cargados desde la plantilla`)
  }

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

        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              agregarOperador()
            }}
          >
            <input
              aria-label="Nombre del operador"
              placeholder="Nombre del operador (Ej. JUAN PEREZ GARCIA)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background/70 px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none md:w-80"
            />
            <button
              type="button"
              onClick={agregarOperador}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-success px-4 text-sm font-semibold text-background shadow-lg shadow-success/25 hover:bg-success/90"
            >
              <Plus className="size-4" aria-hidden />
              Agregar operador
            </button>
          </form>
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 text-sm font-semibold text-primary hover:bg-primary/20"
          >
            <FileDown className="size-4" aria-hidden />
            Plantilla
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-secondary px-4 text-sm font-semibold"
          >
            <CloudUpload className="size-4" aria-hidden />
            Subir Plantilla
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} aria-hidden onChange={handleImport} />
          <p className="text-xs text-muted-foreground">
            La plantilla es un CSV de una sola columna (OPERADOR) que puedes llenar en Excel para la carga masiva de nombres.
          </p>
        </div>
        {notice && (
          <p role="status" className="text-sm font-semibold text-success">
            {notice}
          </p>
        )}

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
          <table className="w-full min-w-[1240px] text-sm">
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
                <th scope="col" className="px-4 py-4 text-center font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 && (
                <EmptyRow colSpan={10}>
                  {query ? 'Sin operadores que coincidan con la búsqueda' : 'Sin operadores: escribe un nombre o sube la plantilla para armar el rol'}
                </EmptyRow>
              )}
              {visibles.map((operador) => {
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
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <IconButton
                          label={`Quitar a ${operador} del rol`}
                          tone="danger"
                          onClick={() => {
                            if (window.confirm(`¿Quitar a ${operador} de la plantilla del rol?`)) dispatch({ type: 'removeOperador', nombre: operador })
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
