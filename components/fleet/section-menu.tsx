'use client'

import { useEffect, useRef, useState } from 'react'
import { CalendarClock, ChevronDown, ClipboardList, Layers, Radio, Tv } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabId = 'patio' | 'planeacion' | 'supervisor' | 'resumen' | 'incidencias'

const SECTIONS: { id: TabId; label: string; hint: string; icon: typeof Layers }[] = [
  { id: 'patio', label: 'Patio', hint: 'Unidades en el CD', icon: Layers },
  { id: 'planeacion', label: 'Planeación', hint: 'Embarques del día', icon: CalendarClock },
  { id: 'supervisor', label: 'Supervisor', hint: 'Monitoreo en ruta', icon: Radio },
  { id: 'resumen', label: 'Resumen', hint: 'Tablero general', icon: Tv },
  { id: 'incidencias', label: 'Incidencias', hint: 'Rol semanal de operadores', icon: ClipboardList },
]

/**
 * Desplegable de secciones de la interfaz principal: Patio, Planeación, Supervisor,
 * Resumen e Incidencias. Cierra al elegir, al hacer clic fuera y con Escape.
 */
export function SectionMenu({
  tab,
  onTabChange,
  badge,
}: {
  tab: TabId
  onTabChange: (tab: TabId) => void
  badge?: number
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const active = SECTIONS.find((section) => section.id === tab) ?? SECTIONS[0]
  const ActiveIcon = active.icon

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex h-11 items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 text-sm text-foreground shadow-lg shadow-primary/10 transition-colors hover:bg-primary/20',
          open && 'bg-primary/20',
        )}
      >
        <ActiveIcon className="size-4 text-primary" aria-hidden />
        <span className="hidden text-[11px] font-semibold tracking-wider text-muted-foreground uppercase sm:inline">Sección</span>
        <span className="font-semibold">{active.label}</span>
        {active.id === 'resumen' && typeof badge === 'number' && (
          <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{badge}</span>
        )}
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Secciones del sistema"
          className="absolute top-full left-0 z-40 mt-2 w-72 rounded-xl border border-border bg-popover/95 p-1.5 shadow-2xl shadow-background/70 backdrop-blur-md"
        >
          {SECTIONS.map(({ id, label, hint, icon: Icon }) => {
            const isActive = id === tab
            return (
              <button
                key={id}
                type="button"
                role="menuitem"
                aria-current={isActive ? 'true' : undefined}
                onClick={() => {
                  onTabChange(id)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  isActive ? 'bg-primary/15 text-foreground' : 'text-secondary-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <Icon className={cn('size-4', isActive ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
                <span className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </span>
                {isActive && <span className="size-2 rounded-full bg-primary" aria-hidden />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
