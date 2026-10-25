import type { ComponentProps, ReactNode } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TripKind } from '@/lib/fleet-data'

export function Panel({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn('rounded-2xl border border-border bg-card/85 shadow-xl shadow-background/60 backdrop-blur-md', className)}
      {...props}
    />
  )
}

export function FilterChip({
  active,
  className,
  tone = 'primary',
  ...props
}: ComponentProps<'button'> & { active?: boolean; tone?: 'primary' | 'danger' }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring',
        active
          ? 'border-primary bg-primary font-semibold text-primary-foreground shadow-md shadow-primary/30'
          : tone === 'danger'
            ? 'border-danger/50 bg-danger/5 text-danger hover:bg-danger/15'
            : 'border-border bg-secondary/70 text-secondary-foreground hover:border-primary/40 hover:text-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function EcoBadge({ eco, prefix = false, className }: { eco: string; prefix?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-sm font-semibold text-primary',
        className,
      )}
    >
      {prefix ? `ECO ${eco}` : eco}
    </span>
  )
}

export function KindTag({ kind }: { kind: TripKind }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-wider',
        kind === 'LOCAL' ? 'border-success/40 bg-success/10 text-success' : 'border-violet/40 bg-violet/10 text-violet',
      )}
    >
      {kind}
    </span>
  )
}

export type PillTone = 'warning' | 'success' | 'danger' | 'primary' | 'violet' | 'muted' | 'warning-outline'

const PILL_TONES: Record<PillTone, string> = {
  warning: 'bg-warning text-background border-warning',
  'warning-outline': 'border-warning/50 bg-warning/10 text-warning',
  success: 'border-success/50 bg-success/15 text-success',
  danger: 'border-danger/50 bg-danger/15 text-danger',
  primary: 'border-primary/50 bg-primary/15 text-primary',
  violet: 'border-violet/50 bg-violet/15 text-violet',
  muted: 'border-border bg-secondary text-secondary-foreground',
}

export function StatusPill({ tone, children, className }: { tone: PillTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-24 items-center justify-center rounded-full border px-4 py-1.5 text-center text-xs font-bold leading-tight',
        PILL_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function IconButton({
  className,
  tone = 'default',
  label,
  ...props
}: ComponentProps<'button'> & { tone?: 'default' | 'danger'; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-lg border transition-colors [&_svg]:size-4',
        tone === 'danger'
          ? 'border-danger/30 bg-danger/10 text-danger hover:bg-danger/20'
          : 'border-border bg-secondary text-muted-foreground hover:text-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function SearchField({
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'type'> & { 'aria-label': string }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type="search"
        className="h-10 w-full rounded-lg border border-border bg-background/70 pr-3 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none"
        {...props}
      />
    </div>
  )
}

export function PlanChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary">
      Plan: {label}
    </span>
  )
}

export function ToolbarButton({
  tone,
  className,
  ...props
}: ComponentProps<'button'> & { tone: 'primary' | 'violet' | 'success' | 'solid' }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-sm font-semibold transition-colors [&_svg]:size-4',
        tone === 'primary' && 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20',
        tone === 'violet' && 'border-violet/40 bg-violet/10 text-violet hover:bg-violet/20',
        tone === 'success' && 'border-success/40 bg-success/10 text-success hover:bg-success/20',
        tone === 'solid' && 'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
        className,
      )}
      {...props}
    />
  )
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-muted-foreground">
        {children}
      </td>
    </tr>
  )
}
