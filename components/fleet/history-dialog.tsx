'use client'

import { History, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useFleet } from '@/lib/fleet-store'
import { formatPlanDate } from '@/lib/fleet-format'

const timeFmt = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

export function HistoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { history, dispatch } = useFleet()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <History className="size-5 text-violet" aria-hidden />
            Historial de días guardados
          </DialogTitle>
          <DialogDescription>Restaura el estado de flota y embarques de un día guardado.</DialogDescription>
        </DialogHeader>
        <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto scrollbar-thin">
          {history.map((h) => {
            const loads = h.snapshot.trips.length
            const taller = h.snapshot.units.filter((u) => u.patioStatus === 'taller').length
            return (
              <li key={h.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/50 p-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-sm font-semibold text-primary">Plan: {formatPlanDate(h.planDate)}</span>
                  <span className="text-xs text-muted-foreground">
                    {h.label} · {timeFmt.format(new Date(h.savedAt))}
                  </span>
                  <span className="text-xs text-secondary-foreground">
                    {h.snapshot.units.length} unidades · {loads} viajes · {taller} en taller
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'restore', id: h.id })
                    onOpenChange(false)
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-violet/40 bg-violet/10 px-3 text-xs font-semibold text-violet hover:bg-violet/20"
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  Restaurar
                </button>
              </li>
            )
          })}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
