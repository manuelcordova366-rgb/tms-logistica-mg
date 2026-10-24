'use client'

import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import {
  SEED_HISTORY,
  SEED_TRIPS,
  SEED_UNITS,
  type FleetData,
  type HistoryEntry,
  type IncidenciaRegistro,
  type IncidenciaTipo,
  type PatioStatus,
  type SupervisorStatus,
  type Trip,
  type Unit,
} from './fleet-data'

interface FleetState {
  units: Unit[]
  trips: Trip[]
  history: HistoryEntry[]
  planDate: string
  /** Rol de incidencias: `"<fecha ISO>|<operador>"` → incidencia del día. */
  incidencias: IncidenciaRegistro
}

type Action =
  | { type: 'setPlanDate'; date: string }
  | { type: 'upsertUnit'; unit: Unit; originalEco?: string }
  | { type: 'deleteUnit'; eco: string }
  | { type: 'setUnitStatus'; eco: string; status: PatioStatus }
  | { type: 'toggleNoCubre'; eco: string }
  | { type: 'upsertTrip'; trip: Trip }
  | { type: 'deleteTrip'; id: string }
  | { type: 'importTrips'; trips: Trip[] }
  | { type: 'setSupStatus'; id: string; status: SupervisorStatus; time: string }
  | { type: 'saveDay'; entry: HistoryEntry }
  | { type: 'restore'; id: string }
  | { type: 'hydrate'; data: FleetData }
  | { type: 'importUnits'; units: Unit[] }
  | { type: 'setIncidencia'; key: string; tipo: IncidenciaTipo }

function reducer(state: FleetState, action: Action): FleetState {
  switch (action.type) {
    case 'setPlanDate':
      return { ...state, planDate: action.date }
    case 'upsertUnit': {
      const key = action.originalEco ?? action.unit.eco
      const exists = state.units.some((x) => x.eco === key)
      const units = exists
        ? state.units.map((x) => (x.eco === key ? action.unit : x))
        : [...state.units, action.unit]
      const trips =
        action.originalEco && action.originalEco !== action.unit.eco
          ? state.trips.map((tr) => (tr.eco === action.originalEco ? { ...tr, eco: action.unit.eco } : tr))
          : state.trips
      return { ...state, units, trips }
    }
    case 'deleteUnit':
      return {
        ...state,
        units: state.units.filter((x) => x.eco !== action.eco),
        trips: state.trips.filter((tr) => tr.eco !== action.eco),
      }
    case 'setUnitStatus':
      return {
        ...state,
        units: state.units.map((x) => (x.eco === action.eco ? { ...x, patioStatus: action.status, noCubre: false } : x)),
      }
    case 'toggleNoCubre':
      return {
        ...state,
        units: state.units.map((x) => (x.eco === action.eco ? { ...x, noCubre: !x.noCubre } : x)),
      }
    case 'upsertTrip': {
      const exists = state.trips.some((tr) => tr.id === action.trip.id)
      return {
        ...state,
        trips: exists
          ? state.trips.map((tr) => (tr.id === action.trip.id ? action.trip : tr))
          : [...state.trips, action.trip],
      }
    }
    case 'deleteTrip':
      return { ...state, trips: state.trips.filter((tr) => tr.id !== action.id) }
    case 'importTrips':
      return { ...state, trips: [...state.trips, ...action.trips] }
    case 'setSupStatus':
      return {
        ...state,
        trips: state.trips.map((tr) => {
          if (tr.id !== action.id) return tr
          const reachedBranch = action.status === 'EN SUCURSAL' || action.status === 'DESCARGANDO'
          return {
            ...tr,
            supStatus: action.status,
            eta: reachedBranch && !tr.eta ? action.time : action.status === 'CARGADO' ? '' : tr.eta,
          }
        }),
      }
    case 'saveDay':
      return { ...state, history: [action.entry, ...state.history] }
    case 'hydrate':
      return {
        units: action.data.units,
        trips: action.data.trips,
        history: action.data.history,
        planDate: action.data.planDate,
        incidencias: action.data.incidencias ?? {},
      }
    case 'setIncidencia':
      return { ...state, incidencias: { ...state.incidencias, [action.key]: action.tipo } }
    case 'importUnits': {
      const byEco = new Map(state.units.map((u) => [u.eco, u]))
      for (const unit of action.units) byEco.set(unit.eco, unit)
      return { ...state, units: [...byEco.values()] }
    }
    case 'restore': {
      const entry = state.history.find((h) => h.id === action.id)
      if (!entry) return state
      return {
        ...state,
        units: entry.snapshot.units,
        trips: entry.snapshot.trips,
        planDate: entry.planDate,
      }
    }
  }
}

function useFleetValue() {
  const [state, dispatch] = useReducer(reducer, {
    units: SEED_UNITS,
    trips: SEED_TRIPS,
    history: SEED_HISTORY,
    planDate: '2026-10-01',
    incidencias: {},
  })

  const tripsByEco = useMemo(() => {
    const map = new Map<string, Trip[]>()
    for (const tr of state.trips) {
      const list = map.get(tr.eco) ?? []
      list.push(tr)
      map.set(tr.eco, list)
    }
    for (const list of map.values()) list.sort((a, b) => (a.folio ?? 999) - (b.folio ?? 999))
    return map
  }, [state.trips])

  const unitByEco = useMemo(() => new Map(state.units.map((x) => [x.eco, x])), [state.units])

  const saveDay = useCallback(
    (label = 'Cierre de turno') => {
      const now = new Date()
      const entry: HistoryEntry = {
        id: `hist-${now.getTime()}`,
        savedAt: now.toISOString(),
        planDate: state.planDate,
        label,
        snapshot: { units: state.units, trips: state.trips },
      }
      dispatch({ type: 'saveDay', entry })
      // Returned so the caller can persist the very same snapshot it just stored.
      return entry
    },
    [state.planDate, state.units, state.trips],
  )

  return { ...state, dispatch, tripsByEco, unitByEco, saveDay }
}

type FleetContextValue = ReturnType<typeof useFleetValue>

const FleetContext = createContext<FleetContextValue | null>(null)

export function FleetProvider({ children }: { children: ReactNode }) {
  const value = useFleetValue()
  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>
}

export function useFleet() {
  const ctx = useContext(FleetContext)
  if (!ctx) throw new Error('useFleet must be used inside FleetProvider')
  return ctx
}

export function isUnitBusy(unit: Unit, tripsByEco: Map<string, Trip[]>) {
  return unit.patioStatus !== 'taller' && (tripsByEco.get(unit.eco)?.length ?? 0) > 0
}

export function newTripId() {
  return `trip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
