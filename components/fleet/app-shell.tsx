'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { CirclePlus, CloudUpload, FileSpreadsheet, History, Save } from 'lucide-react'
import { FleetProvider, newTripId, useFleet } from '@/lib/fleet-store'
import { exportPatio, exportTrips } from '@/lib/fleet-exports'
import { parseCsv } from '@/lib/fleet-format'
import type { Trip, Unit } from '@/lib/fleet-data'
import { Header, type TabId } from './header'
import { NetworkBackground } from './network-background'
import { ToolbarButton } from './primitives'
import { ResumenView } from './resumen-view'
import { PatioView } from './patio-view'
import { PlaneacionView } from './planeacion-view'
import { SupervisorView } from './supervisor-view'
import { ColocacionView } from './colocacion-view'
import { UnitDialog } from './unit-dialog'
import { TripDialog, type TripDialogState } from './trip-dialog'
import { HistoryDialog } from './history-dialog'

export function AppShell() {
  return (
    <FleetProvider>
      <FleetApp />
    </FleetProvider>
  )
}

function FleetApp() {
  const fleet = useFleet()
  const [tab, setTab] = useState<TabId>('resumen')
  const [unitDialog, setUnitDialog] = useState<{ unit: Unit | null } | null>(null)
  const [tripDialog, setTripDialog] = useState<TripDialogState | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const notify = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2800)
  }

  const onNewTrip = (eco?: string) => setTripDialog({ trip: null, defaultEco: eco })
  const onEditTrip = (trip: Trip) => setTripDialog({ trip })
  const onEditUnit = (unit: Unit) => setUnitDialog({ unit })

  const exportPlaneacion = () => exportTrips('planeacion-oficial', fleet.trips, fleet.unitByEco, fleet.planDate)

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/\.csv$/i.test(file.name)) {
      notify('Guarda la planeación de Excel como CSV (.csv) para subirla')
      return
    }
    const rows = parseCsv(await file.text())
    const nextFolio = Math.max(0, ...fleet.trips.map((t) => t.folio ?? 0)) + 1
    const trips: Trip[] = rows
      .map((r, i) => {
        const eco = (r.eco || r.unidad || r['eco unidad'] || '').trim()
        const destino = (r.destino || r.sucursal || r['sucursal / destino'] || '').trim()
        if (!eco || !destino) return null
        const folio = Number(r.viaje || r.folio)
        const kind = /for/i.test(r.tipo ?? '') ? 'FORÁNEO' : 'LOCAL'
        return {
          id: newTripId(),
          folio: Number.isInteger(folio) && folio > 0 ? folio : nextFolio + i,
          eco,
          operador: (r.operador || 'POR ASIGNAR').toUpperCase(),
          turno: r.turno || 'M1',
          carga: (r.carga || r['# carga'] || '').toUpperCase(),
          destino,
          entregas: (r.entregas || '').split('|').map((s) => s.trim()).filter(Boolean),
          kind,
          cluster: (r.cluster || '').toUpperCase(),
          salida: r.salida || '',
          tiempoEst: '—',
          eta: '',
          rampa: r.rampa || r.cajon || '',
          planStatus: 'CARGADO',
          supStatus: 'CARGADO',
          regresaManana: /^s/i.test(r['regresa manana'] ?? ''),
          observaciones: r.observaciones || '',
        } satisfies Trip
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)
    if (trips.length === 0) {
      notify('No se encontraron filas válidas (se requieren columnas ECO y Destino)')
      return
    }
    fleet.dispatch({ type: 'importTrips', trips })
    notify(`${trips.length} viajes importados`)
  }

  const saveDay = () => {
    fleet.saveDay()
    notify('Día guardado en el historial')
  }

  const common = (
    <>
      <ToolbarButton tone="primary" onClick={saveDay}>
        <Save aria-hidden />
        Guardar Día
      </ToolbarButton>
      <ToolbarButton tone="violet" onClick={() => setHistoryOpen(true)}>
        <History aria-hidden />
        Historial
        <span className="rounded-full bg-violet px-1.5 font-mono text-[11px] text-foreground">{fleet.history.length}</span>
      </ToolbarButton>
    </>
  )

  const actions: Record<TabId, React.ReactNode> = {
    patio: (
      <>
        {common}
        <ToolbarButton tone="success" onClick={() => exportPatio(fleet.units, fleet.tripsByEco, fleet.planDate)}>
          <FileSpreadsheet aria-hidden />
          Excel Patio
        </ToolbarButton>
      </>
    ),
    planeacion: (
      <>
        <ToolbarButton tone="primary" onClick={() => fileRef.current?.click()}>
          <CloudUpload aria-hidden />
          Subir Excel
        </ToolbarButton>
        <ToolbarButton tone="solid" onClick={() => onNewTrip()}>
          <CirclePlus aria-hidden />
          Nuevo Viaje
        </ToolbarButton>
        {common}
      </>
    ),
    supervisor: (
      <>
        {common}
        <ToolbarButton tone="success" onClick={() => exportTrips('supervisor', fleet.trips, fleet.unitByEco, fleet.planDate)}>
          <FileSpreadsheet aria-hidden />
          Excel Supervisor
        </ToolbarButton>
      </>
    ),
    resumen: (
      <>
        {common}
        <ToolbarButton tone="success" onClick={() => exportTrips('resumen', fleet.trips, fleet.unitByEco, fleet.planDate)}>
          <FileSpreadsheet aria-hidden />
          Excel Resumen
        </ToolbarButton>
      </>
    ),
    colocacion: null,
  }

  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <NetworkBackground />
      <Header tab={tab} onTabChange={setTab} actions={actions[tab]} />

      <main className="flex-1 px-4 py-5 md:px-5">
        {tab === 'resumen' && <ResumenView />}
        {tab === 'patio' && (
          <PatioView onNewUnit={() => setUnitDialog({ unit: null })} onEditUnit={onEditUnit} onNewTrip={onNewTrip} />
        )}
        {tab === 'planeacion' && (
          <PlaneacionView
            onNewTrip={onNewTrip}
            onEditTrip={onEditTrip}
            onEditUnit={onEditUnit}
            onImport={() => fileRef.current?.click()}
            onExport={exportPlaneacion}
          />
        )}
        {tab === 'supervisor' && <SupervisorView onEditTrip={onEditTrip} />}
        {tab === 'colocacion' && <ColocacionView />}
      </main>

      <footer className="border-t border-border bg-background/85 px-4 py-6 text-center text-xs text-muted-foreground backdrop-blur-md">
        <span className="font-semibold text-secondary-foreground">Software de monitoreo de unidades</span>
        <span className="mx-2" aria-hidden>
          •
        </span>
        Patio (En CD) | Planeación | Supervisor (Ruta) | Resumen General | Colocación
      </footer>

      <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} aria-hidden onChange={handleImport} />

      <UnitDialog unit={unitDialog?.unit ?? null} open={unitDialog !== null} onOpenChange={(o) => !o && setUnitDialog(null)} />
      <TripDialog state={tripDialog} onOpenChange={(o) => !o && setTripDialog(null)} />
      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />

      <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50">
        {toast && (
          <p className="rounded-lg border border-success/40 bg-card px-4 py-2.5 text-sm font-semibold text-success shadow-xl">{toast}</p>
        )}
      </div>
    </div>
  )
}
