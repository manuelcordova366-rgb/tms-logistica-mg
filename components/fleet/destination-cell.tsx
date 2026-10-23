import { MapPin, RefreshCw, Ban } from 'lucide-react'
import type { Trip, TripKind } from '@/lib/fleet-data'
import { KindTag } from './primitives'

export function ReturnTag({ trip }: { trip: Trip }) {
  if (trip.regresaManana) {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
        <RefreshCw className="size-3" aria-hidden />
        Regresa Mañana
      </span>
    )
  }
  if (trip.noRegresaDias) {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[11px] font-semibold text-warning">
        <Ban className="size-3" aria-hidden />
        No regresa ({trip.noRegresaDias}d)
      </span>
    )
  }
  return null
}

export function DestinationCell({ trip, fallbackKind = 'LOCAL' }: { trip?: Trip; fallbackKind?: TripKind }) {
  if (!trip) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <MapPin className="size-4 text-primary" aria-hidden />
        <span className="font-semibold">Sin definir</span>
        <KindTag kind={fallbackKind} />
      </div>
    )
  }
  return (
    <div className="flex max-w-sm flex-col gap-1.5">
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span className="font-semibold text-pretty">{trip.destino}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <KindTag kind={trip.kind} />
        <ReturnTag trip={trip} />
      </div>
      {trip.entregas.length > 0 && (
        <p className="text-xs leading-relaxed text-secondary-foreground">
          <span className="font-semibold text-primary">+{trip.entregas.length} entregas: </span>
          {trip.entregas.join(' · ')}
        </p>
      )}
    </div>
  )
}
