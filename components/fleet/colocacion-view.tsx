'use client'

import { useRef, useState, type FormEvent } from 'react'
import { toBlob, toPng } from 'html-to-image'
import { CalendarDays, ChevronLeft, ChevronRight, CircleCheck, Cloud, Copy, Download, Pencil, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFleet } from '@/lib/fleet-store'
import { formatLongDate, shiftISODate, toISODate } from '@/lib/fleet-format'
import { MOVIMIENTOS_LABELS } from '@/lib/fleet-data'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from './form-fields'
import { ColocacionReport, type DayData } from './colocacion-report'

const EMPTY_DAY: DayData = {
  movimientos: MOVIMIENTOS_LABELS.map(() => 0),
  ppe: 0,
  com: 0,
  pendientes: [],
  observaciones: 'Operación en curso sin novedades extraordinarias reportadas en CEDIS Villahermosa.',
}

export function ColocacionView() {
  const { planDate } = useFleet()
  const [date, setDate] = useState(planDate)
  const [days, setDays] = useState<Record<string, DayData>>({})
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')
  const reportRef = useRef<HTMLDivElement>(null)

  const day = days[date] ?? EMPTY_DAY
  const savedDates = [...saved].sort().reverse()

  const flash = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 2500)
  }

  async function handleDownload() {
    if (!reportRef.current) return
    const url = await toPng(reportRef.current, { pixelRatio: 2, cacheBust: true })
    const a = document.createElement('a')
    a.href = url
    a.download = `plan-colocacion-villahermosa-${date}.png`
    a.click()
  }

  async function handleCopy() {
    if (!reportRef.current) return
    try {
      const blob = await toBlob(reportRef.current, { pixelRatio: 2, cacheBust: true })
      if (!blob) throw new Error('empty')
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      flash('Imagen copiada al portapapeles')
    } catch {
      flash('Tu navegador no permitió copiar; usa Descargar PNG HD')
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section aria-label="Controles del plan de colocación" className="flex flex-col gap-4 rounded-2xl border border-border bg-card/85 p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          <ToolBtn label="Día anterior" onClick={() => setDate(shiftISODate(date, -1))}>
            <ChevronLeft className="size-4" />
          </ToolBtn>
          <label className="relative inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background/70 px-3">
            <CalendarDays className="size-4 text-primary" aria-hidden />
            <span className="sr-only">Fecha del reporte</span>
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="bg-transparent font-mono text-sm text-foreground [color-scheme:dark] focus:outline-none"
            />
          </label>
          <ToolBtn label="Día siguiente" onClick={() => setDate(shiftISODate(date, 1))}>
            <ChevronRight className="size-4" />
          </ToolBtn>
          <button
            type="button"
            onClick={() => setDate(toISODate(new Date()))}
            className="h-10 rounded-lg border border-border bg-secondary px-4 text-sm font-semibold"
          >
            Hoy
          </button>
          <select
            aria-label="Días guardados"
            value={saved.has(date) ? date : ''}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background/70 px-3 text-sm"
          >
            <option value="">{formatLongDate(date)}</option>
            {savedDates.map((d) => (
              <option key={d} value={d}>
                {formatLongDate(d)} (guardado)
              </option>
            ))}
          </select>
          <span
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-full border px-3 font-mono text-[11px] font-bold',
              saved.has(date) ? 'border-success/40 bg-success/10 text-success' : 'border-border bg-secondary text-muted-foreground',
            )}
          >
            <Cloud className="size-3.5" aria-hidden />
            {saved.has(date) ? 'GUARDADO' : 'SIN GUARDAR'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDays((prev) => ({ ...prev, [date]: day }))
              setSaved((prev) => new Set(prev).add(date))
              flash('Día guardado')
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 text-sm font-semibold text-success"
          >
            <Save className="size-4" aria-hidden />
            Guardar Día
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-secondary px-3 text-sm font-semibold"
          >
            <Pencil className="size-4" aria-hidden />
            Editar Datos
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 text-sm font-semibold text-primary"
          >
            <Copy className="size-4" aria-hidden />
            Copiar Imagen
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-sm font-semibold text-background"
          >
            <Download className="size-4" aria-hidden />
            Descargar PNG HD
          </button>
          <p role="status" aria-live="polite" className="inline-flex items-center gap-1.5 text-sm text-success">
            {notice && <CircleCheck className="size-4" aria-hidden />}
            {notice}
          </p>
        </div>
      </section>

      <div className="overflow-x-auto rounded-sm scrollbar-thin">
        <ColocacionReport ref={reportRef} date={date} day={day} />
      </div>

      <EditDayDialog
        open={editing}
        onOpenChange={setEditing}
        day={day}
        onSave={(next) => setDays((prev) => ({ ...prev, [date]: next }))}
      />
    </div>
  )
}

function ToolBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-10 w-14 items-center justify-center rounded-lg border border-border bg-secondary text-secondary-foreground hover:text-foreground"
    >
      {children}
    </button>
  )
}

function EditDayDialog({
  open,
  onOpenChange,
  day,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  day: DayData
  onSave: (day: DayData) => void
}) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const num = (k: string) => Math.max(0, Math.floor(Number(d.get(k)) || 0))
    onSave({
      movimientos: MOVIMIENTOS_LABELS.map((_, i) => num(`mov-${i}`)),
      ppe: num('ppe'),
      com: num('com'),
      observaciones: String(d.get('observaciones') ?? '').trim(),
      pendientes: String(d.get('pendientes') ?? '')
        .split('\n')
        .map((line) => line.split('|').map((s) => s.trim()))
        .filter(([folio]) => folio)
        .map(([folio, m3, obs]) => ({ folio, m3: Number(m3) || 0, obs: obs ?? '' })),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {open && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Editar datos del plan de colocación</DialogTitle>
              <DialogDescription>Movimientos, piezas, cargas pendientes y observaciones del día.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {MOVIMIENTOS_LABELS.map((label, i) => (
                <Field key={label} label={label} htmlFor={`mov-${i}`}>
                  <Input id={`mov-${i}`} name={`mov-${i}`} type="number" min={0} defaultValue={day.movimientos[i]} className="h-9 bg-background" />
                </Field>
              ))}
              <Field label="PPE" htmlFor="ppe">
                <Input id="ppe" name="ppe" type="number" min={0} defaultValue={day.ppe} className="h-9 bg-background" />
              </Field>
              <Field label=".COM" htmlFor="com">
                <Input id="com" name="com" type="number" min={0} defaultValue={day.com} className="h-9 bg-background" />
              </Field>
            </div>
            <Field label="Cargas pendientes (folio/destino | m³ | observación)" htmlFor="pendientes">
              <Textarea
                id="pendientes"
                name="pendientes"
                rows={3}
                placeholder="CS00381200 Comalcalco | 50 | Falta mercancía"
                defaultValue={day.pendientes.map((p) => `${p.folio} | ${p.m3} | ${p.obs}`).join('\n')}
                className="bg-background"
              />
            </Field>
            <Field label="Observaciones" htmlFor="observaciones">
              <Textarea id="observaciones" name="observaciones" rows={2} defaultValue={day.observaciones} className="bg-background" />
            </Field>
            <DialogFooter className="bg-secondary/50">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Aplicar</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
