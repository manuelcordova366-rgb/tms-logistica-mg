export type UnitKind = 'Camioneta' | 'Rango Medio' | 'Sencillo' | 'Tracto / Full'
export type FleetGroup = 'camionetas' | 'rabones' | 'tractos'
export type PatioStatus = 'disponible' | 'ruta' | 'colocado' | 'taller'
export type TripKind = 'LOCAL' | 'FORÁNEO'
export type PlanStatus =
  | 'CARGADO'
  | 'COLOCADO'
  | 'PENDIENTE'
  | 'NO SE CUBRE'
  | 'CANCELADO'
  | 'REPROGRAMADO'
  | 'CONTINUACIÓN'
  | 'ANALIZANDO'
  | 'HORAS DOT'
  | 'POR SALIR'

/** Options of the trip form's "Estatus planeación" selector. */
export const PLAN_STATUSES: PlanStatus[] = [
  'CARGADO',
  'COLOCADO',
  'PENDIENTE',
  'NO SE CUBRE',
  'CANCELADO',
  'REPROGRAMADO',
  'CONTINUACIÓN',
  'ANALIZANDO',
  'HORAS DOT',
  'POR SALIR',
]
export type SupervisorStatus =
  | 'CARGADO'
  | 'EN RUTA'
  | 'EN SUCURSAL'
  | 'DESCARGANDO'
  | 'RETORNO'
  | 'ALERTA'
  | 'COMPLETADO'
  | 'CANCELADO'
  | 'REPROGRAMADO'
  | 'CONTINUACIÓN'

export interface Unit {
  eco: string
  placas: string
  capacidad: number
  kind: UnitKind
  patioStatus: PatioStatus
  noCubre?: boolean
}

export interface Trip {
  id: string
  folio: number | null
  eco: string
  /** Número de pipa que lleva el viaje: se escribe a mano y no forma parte del registro de patio. */
  pipa: string
  operador: string
  turno: string
  carga: string
  destino: string
  entregas: string[]
  kind: TripKind
  salida: string
  tiempoEst: string
  eta: string
  planStatus: PlanStatus
  supStatus: SupervisorStatus
  regresaManana: boolean
  noRegresaDias?: number
  observaciones: string
}

export interface FleetSnapshot {
  units: Unit[]
  trips: Trip[]
}

export interface HistoryEntry {
  id: string
  savedAt: string
  planDate: string
  label: string
  snapshot: FleetSnapshot
}

/** Everything that is persisted for a plan day (see `app/actions/fleet.ts`). */
export interface FleetData {
  units: Unit[]
  trips: Trip[]
  history: HistoryEntry[]
  planDate: string
  /** Rol de incidencias capturado por semana (opcional: las filas previas no lo traen). */
  incidencias?: IncidenciaRegistro
  /** Plantilla de operadores del rol de incidencias (opcional: las filas previas no la traen). */
  operadores?: string[]
}

export function fleetGroupOf(kind: UnitKind): FleetGroup {
  if (kind === 'Camioneta') return 'camionetas'
  if (kind === 'Rango Medio') return 'rabones'
  return 'tractos'
}

export const FLEET_GROUP_LABEL: Record<FleetGroup, string> = {
  camionetas: 'Camionetas',
  rabones: 'Rabones',
  tractos: 'Tractos / Fulles',
}

/** Kinds offered when a unit is registered by hand. */
export const UNIT_KINDS: UnitKind[] = ['Sencillo', 'Tracto / Full']

export const PATIO_STATUS_LABEL: Record<PatioStatus, string> = {
  disponible: 'Disponible en Patio',
  ruta: 'Ruta asignada',
  colocado: 'Colocado p/ Carga',
  taller: 'Taller / Mtto',
}

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

/** Tolerant readers for the bulk-upload template: accept the values shown in the UI. */
export function normalizeUnitKind(value: string): UnitKind {
  const v = normalize(value)
  if (v.includes('tract') || v.includes('full')) return 'Tracto / Full'
  if (v.includes('rango') || v.includes('rabon') || v.includes('medio')) return 'Rango Medio'
  if (v.includes('camioneta')) return 'Camioneta'
  return 'Sencillo'
}

export function normalizePatioStatus(value: string): PatioStatus {
  const v = normalize(value)
  if (v.includes('taller') || v.includes('mtto') || v.includes('mantenimiento')) return 'taller'
  if (v.includes('ruta') || v.includes('asignad')) return 'ruta'
  if (v.includes('colocad')) return 'colocado'
  return 'disponible'
}

/** Nombres de operador tal como se capturan en el rol: sin espacios sobrantes ni duplicados. */
export function normalizeOperador(value: string) {
  return value.trim().replace(/\s+/g, ' ').toUpperCase()
}

/** Une la plantilla actual con los nombres nuevos, sin duplicados y en orden alfabético. */
export function mergeOperadores(actuales: string[], nuevos: string[]) {
  const byName = new Map<string, string>()
  for (const nombre of [...actuales, ...nuevos]) {
    const limpio = normalizeOperador(nombre)
    if (limpio) byName.set(limpio, limpio)
  }
  return [...byName.values()].sort((a, b) => a.localeCompare(b, 'es'))
}

/**
 * El registro de unidades arranca vacío: se dio de baja toda la plantilla anterior.
 * Las unidades se capturan a mano desde Patio ("Registrar Unidad en Patio") o con la
 * plantilla CSV.
 */
export const SEED_UNITS: Unit[] = []

/**
 * La planeación también arranca desde cero: no hay viajes de demostración. Los viajes se
 * capturan a mano ("Nuevo Viaje") o se suben desde la plantilla de Excel/CSV.
 */
export const SEED_TRIPS: Trip[] = []

/** Incidencias que se registran en el rol semanal de operadores (lunes a domingo). */
export type IncidenciaTipo = 'ASISTENCIA' | 'FALTA' | 'INCAPACIDAD' | 'PERMISO' | 'TRASLADO' | 'VACACIONES'

export const INCIDENCIA_TIPOS: IncidenciaTipo[] = ['ASISTENCIA', 'FALTA', 'INCAPACIDAD', 'PERMISO', 'TRASLADO', 'VACACIONES']

export const INCIDENCIA_LABEL: Record<IncidenciaTipo, string> = {
  ASISTENCIA: 'Asistencia',
  FALTA: 'Falta',
  INCAPACIDAD: 'Incapacidad',
  PERMISO: 'Permiso',
  TRASLADO: 'Traslado',
  VACACIONES: 'Vacaciones',
}

/** `"<fecha ISO>|<operador>"` → incidencia registrada ese día. Sin registro se asume ASISTENCIA. */
export type IncidenciaRegistro = Record<string, IncidenciaTipo>

/**
 * La plantilla de operadores del rol también arranca vacía: se captura a mano en la
 * pestaña de Incidencias o se sube desde la plantilla CSV.
 */
export const SEED_OPERADORES: string[] = []

/** El historial guardado no arranca con cortes de demostración. */
export const SEED_HISTORY: HistoryEntry[] = []
