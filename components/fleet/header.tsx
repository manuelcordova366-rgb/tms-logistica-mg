'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { CalendarDays, Clock } from 'lucide-react'
import { useFleet } from '@/lib/fleet-store'
import { formatPlanDate } from '@/lib/fleet-format'
import { SectionMenu, type TabId } from './section-menu'

export function Header({
  tab,
  onTabChange,
  actions,
}: {
  tab: TabId
  onTabChange: (tab: TabId) => void
  actions: ReactNode
}) {
  const { units } = useFleet()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex flex-col gap-3 px-4 py-2.5 md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-[72px] items-center justify-center overflow-hidden rounded-lg bg-white p-1">
              <Image src="/logistica-mg-logo-mark.png" alt="Logística M&G TMS" width={525} height={355} className="h-auto w-full" priority />
            </div>
            <h1 className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight">Control de Flota</span>
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Software de monitoreo de unidades</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <PlanDatePicker />
            <LiveClock />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionMenu tab={tab} onTabChange={onTabChange} badge={units.length} />
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </div>
      </div>
    </header>
  )
}

function PlanDatePicker() {
  const { planDate, dispatch } = useFleet()

  return (
    <label className="relative inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 font-mono text-xs text-primary shadow-md shadow-primary/10 hover:bg-primary/15">
      <CalendarDays className="size-4" aria-hidden />
      <span>
        Plan: <strong className="text-foreground">{formatPlanDate(planDate)}</strong>
      </span>
      {/*
        The date input itself covers the chip: a real click on it opens the native picker.
        Calling `showPicker()` instead throws a cross-origin SecurityError inside the preview
        iframe, which is what the issue badge was reporting.
      */}
      <input
        type="date"
        aria-label="Fecha del plan"
        value={planDate}
        onChange={(e) => e.target.value && dispatch({ type: 'setPlanDate', date: e.target.value })}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  )
}

function LiveClock() {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    const tick = () => setTime(fmt.format(new Date()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card/70 px-3 font-mono text-xs text-secondary-foreground sm:inline-flex">
      <span className="size-2 rounded-full bg-success shadow-[0_0_8px] shadow-success" aria-hidden />
      <Clock className="size-4" aria-hidden />
      <time suppressHydrationWarning className="min-w-24 tabular-nums">
        {time ?? '--:--:--'}
      </time>
    </div>
  )
}
