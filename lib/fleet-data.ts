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
  operador: string
  turno: string
  carga: string
  destino: string
  entregas: string[]
  kind: TripKind
  cluster: string
  salida: string
  tiempoEst: string
  eta: string
  rampa: string
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

const u = (eco: string, placas: string, capacidad: number, kind: UnitKind, patioStatus: PatioStatus = 'disponible'): Unit => ({
  eco,
  placas,
  capacidad,
  kind,
  patioStatus,
})

export const SEED_UNITS: Unit[] = [
  u('3153', 'CV4372F', 18, 'Camioneta'),
  u('3426', 'RU5466B', 18, 'Camioneta'),
  u('3271', 'CV4378F', 18, 'Camioneta'),
  u('3496', 'LE39123', 18, 'Camioneta'),
  u('3401', 'RU5464B', 18, 'Camioneta'),
  u('3393', 'GT3465C', 18, 'Camioneta'),
  u('3237', 'LE1734R', 18, 'Camioneta'),
  u('3471', 'CV4395F', 18, 'Camioneta'),
  u('3483', 'LE3094S', 18, 'Camioneta'),
  u('3488', 'CE5426T', 18, 'Camioneta'),
  u('3412', 'BTAC7J', 18, 'Camioneta'),
  u('3455', 'RE7A46H', 18, 'Camioneta'),
  u('3301', 'AD8A3D', 18, 'Camioneta'),
  u('4069', '175FF5', 50, 'Rango Medio'),
  u('4071', '174FF5', 50, 'Rango Medio'),
  u('4100', '21FA46', 50, 'Rango Medio'),
  u('4179', '49FA4J', 50, 'Rango Medio'),
  u('4109', '68FA7G', 50, 'Rango Medio', 'taller'),
  u('4192', '89FA4G', 50, 'Rango Medio', 'taller'),
  u('4142', '18FA56', 50, 'Rango Medio'),
  u('4118', '97FA6H', 50, 'Rango Medio'),
  u('4135', '12FA56', 40, 'Rango Medio'),
  u('4115', '57FA76', 50, 'Rango Medio'),
  u('4198', '94FA68', 50, 'Rango Medio'),
  u('4104', '43FA78', 40, 'Rango Medio'),
  u('4188', '67FA76', 40, 'Rango Medio'),
  u('4168', '43FA4J', 50, 'Rango Medio'),
  u('4125', '05FA56', 50, 'Rango Medio'),
  u('4193', '92FA48', 50, 'Rango Medio'),
  u('5035', '73FA3F', 110, 'Tracto / Full'),
  u('5036', '74FA3F', 90, 'Sencillo'),
  u('5052', '55FA7H', 110, 'Tracto / Full'),
  u('5053', '52FA7H', 110, 'Tracto / Full'),
  u('5069', '99FA6H', 110, 'Tracto / Full'),
  u('5070', '04FA7K', 110, 'Tracto / Full'),
  u('5013', '02DF68', 110, 'Tracto / Full', 'taller'),
  u('5009', '55FA6N', 110, 'Tracto / Full', 'taller'),
  u('5026', '28FA8H', 90, 'Sencillo'),
  u('5054', '73FA3P', 90, 'Sencillo'),
  u('5068', '64BL2S', 110, 'Sencillo'),
  u('5066', '26FA46', 110, 'Tracto / Full'),
]

let tripSeq = 0
const t = (
  folio: number,
  eco: string,
  operador: string,
  carga: string,
  destino: string,
  kind: TripKind,
  salida: string,
  extra: Partial<Trip> = {},
): Trip => ({
  id: `trip-${++tripSeq}`,
  folio,
  eco,
  operador,
  turno: 'M1',
  carga,
  destino,
  entregas: [],
  kind,
  cluster: kind === 'LOCAL' ? '' : 'V-2',
  salida,
  tiempoEst: '—',
  eta: '',
  rampa: String(10 + (folio % 24)),
  planStatus: 'CARGADO',
  supStatus: 'CARGADO',
  regresaManana: false,
  observaciones: '',
  ...extra,
})

export const SEED_TRIPS: Trip[] = [
  t(1, '3153', 'ALEJANDRO RAMON DE LA CRUZ', 'CS00381093', 'EKT VILLAHERMOSAS 2 MADERO', 'LOCAL', '07:34'),
  t(2, '3426', 'MARTIN FRANCISCO CHAN', 'CS00381099', 'EKT VILLAHERMOSA TAMULTE', 'LOCAL', '07:04', {
    entregas: ['EKT TIERRA COLORADA', 'VTEX: 45871530', 'VTEX: 45851650', 'VTEX: 45865367', 'VTEX: 45861694', 'VTEX: 45865194'],
  }),
  t(3, '4142', 'CRISTOBAL RIOS SANCHEZ', 'CS00381057', 'MEGA ELEKTRA PLAZA FLORIDA', 'FORÁNEO', '08:52', {
    regresaManana: true,
    entregas: ['APA DEK TEXISTEPEC VERACRUZ'],
  }),
  t(4, '4118', 'NABOPOLASSAR RAMOS PERALTA', 'CS00381061', 'EKT LA VENTA TABASCO', 'LOCAL', '07:54', { regresaManana: true, cluster: 'TAB-1' }),
  t(5, '4115', 'CRESCENCIO BETANCOURT CHABLE', 'CS00381058', 'EKT MINATITLAN HIDALGO', 'LOCAL', '08:06', { regresaManana: true, cluster: 'VER-1' }),
  t(6, '4135', 'ANDERSON LUISAO HERNANDEZ', 'CS00381059', 'MEGA ELEKTRA TRANSISMICA JALTI', 'LOCAL', '08:52', { regresaManana: true, cluster: 'VER-1' }),
  t(8, '4198', 'JULIO CESAR PEREZ PEREZ', 'CS00381060', 'SYR MINATITLAN', 'LOCAL', '14:24', {
    regresaManana: true,
    cluster: 'VER-1',
    entregas: ['EKT MINATITLAN HIDALGO'],
  }),
  t(9, '3483', 'ARMANDO GARCIA ARIAS', 'CS00381091', 'EKT CHIAPAS REFORMA', 'FORÁNEO', '06:46', { cluster: 'CHIS-1' }),
  t(10, '3393', 'ANTONIO PEREZ PALMA', 'CS00381096', 'EKT VILLAHERMOSAS 2 MADERO', 'LOCAL', '07:34'),
  t(11, '3237', 'NESTOR ANDRES HERNANDEZ PEREZ', 'CS00381092', 'EKT CHIAPAS REFORMA', 'FORÁNEO', '07:34', { cluster: 'CHIS-1' }),
  t(12, '3471', 'JESUS CRUZ PEREZ', 'CS00381094', 'EKT VILLAHERMOSAS 2 MADERO', 'LOCAL', '07:34'),
  t(13, '3401', 'MARTIN CRUZ GARCIA', 'CS00381095', 'EKT VILLAHERMOSAS 2 MADERO', 'LOCAL', '10:14'),
  t(14, '4188', 'LUIS ALBERTH DOMINGUEZ', 'CS00381097', 'EKT YAJALON CHIAPAS', 'FORÁNEO', '10:14', { regresaManana: true, cluster: 'CHIS-2' }),
  t(15, '4104', 'CARLOS HIPOLITO BAUTISTA', 'CS00381068', 'EKT COMALCALCO', 'LOCAL', '08:52', { regresaManana: true, cluster: 'TAB-2' }),
  t(16, '4168', 'RODOLFO ANTONIO EVIA', 'CS00381090', 'EKT CHIAPAS REFORMA', 'FORÁNEO', '13:31', { regresaManana: true, cluster: 'CHIS-1' }),
  t(18, '4125', 'LUIS ENRIQUE LEON BAUTISTA', 'CS00381078', 'EKT MEGA MACUSPANA TABASCO', 'LOCAL', '13:46', { regresaManana: true, cluster: 'TAB-3' }),
  t(21, '5026', 'CONCEPCION ARIAS VELAZQUEZ', 'CS00381100', 'MEGA ELEKTRA JUAN SABINES', 'LOCAL', '12:09', { regresaManana: true }),
  t(24, '3412', 'JOSE VICTOR IZQUIERDO', 'CS00381111', 'EKT MEGA JUCHITAN', 'FORÁNEO', '12:09', {
    noRegresaDias: 1.5,
    cluster: 'OAX-1',
    entregas: ['EKT JUCHITAN 2'],
  }),
  t(26, '3301', 'JOSE MIGUEL GARCIA CONCEPCION', 'CS00381102', 'EKT SAN CRISTOBAL DE LAS CASAS', 'FORÁNEO', '12:09', {
    regresaManana: true,
    cluster: 'CHIS-2',
    entregas: ['MEGA ELEKTRA JUAN SABINES', 'TM SAN CRISTOBAL DE LAS CASAS'],
  }),
  t(27, '5066', 'PEDRO VITAL SANCHEZ', 'CS00381107', 'Ekt Tapachula Salinas', 'FORÁNEO', '12:09', {
    noRegresaDias: 1.46,
    cluster: 'CHIS-3',
    entregas: ['EKT Tapachula Mercado San Juan', 'Mega Elektra Diaz Ordaz'],
  }),
  t(28, '5068', 'FRANCISCO LOPEZ VILLEGAS', 'CS00381112', 'EKT MEGA MATIAS ROMERO', 'FORÁNEO', '14:56', {
    noRegresaDias: 1.38,
    cluster: 'OAX-1',
    rampa: '31',
  }),
  t(30, '3455', 'JUAN CARLOS ROJAS CASANOVA', 'CS00381098', 'EKT YAJALON CHIAPAS', 'FORÁNEO', '12:09', { regresaManana: true, cluster: 'CHIS-2' }),
  t(31, '4193', 'ATILANO RODRIGUEZ MENDEZ', 'CS00381110', 'Ekt Mega Salina Cruz', 'LOCAL', '12:09', {
    regresaManana: true,
    cluster: 'OAX-2',
    entregas: ['Ekt Salina Cruz', 'VTEX: 45845125'],
  }),
  t(33, '3488', 'LUIS ALFONSO LAZARO MAY', 'CS00381065', 'Ekt Motos Tecolutilla', 'LOCAL', '14:28', { cluster: 'TAB-2' }),
  t(35, '5054', 'SEBASTIAN GONGORA JIMENEZ', 'CS00381124', 'EKT CHIAPAS COMALAPA', 'FORÁNEO', '15:00', {
    cluster: 'CHIS-3',
    entregas: [
      'EKT OCOZOCUAUTLA',
      'EKT Motos Tonalá Chis',
      'VTEX: 45849796',
      'VTEX: 45843471',
      'VTEX: 45844306',
      'VTEX: 45835978',
      'VTEX: 45855487',
      'VTEX: 45846609',
      'VTEX: 45844946',
      'VTEX: 45858862',
      'VTEX: 45843082',
      'VTEX: 45843626',
      'VTEX: 45860289',
      'VTEX: 45852745',
    ],
  }),
  t(36, '5054', 'SEBASTIAN GONGORA JIMENEZ', 'CS00381125', 'EKT VILLA FLORES', 'FORÁNEO', '15:30', { cluster: 'CHIS-3' }),
  t(39, '3153', 'ALEJANDRO RAMON DE LA CRUZ', 'CS00381066', 'Ekt Motos Tecolutilla', 'LOCAL', '14:42', { cluster: 'TAB-2' }),
]

export interface ColocacionRow {
  destino: string
  tipo: string
  capacidad: number
  linea: string
}

export const COLOCACION_EJECUTADAS: ColocacionRow[] = [
  { destino: 'Frontera', tipo: 'Retail', capacidad: 18, linea: 'LTI - VHS' },
  { destino: 'Cárdenas Tabasco', tipo: 'Foráneo', capacidad: 50, linea: 'VALLEY' },
  { destino: 'Jalpa de Méndez', tipo: 'HUB', capacidad: 50, linea: 'BRITO' },
  { destino: 'HUB Tuxtla', tipo: 'Retail', capacidad: 153, linea: 'VALLEY' },
  { destino: 'Coatzacoalcos', tipo: 'Foráneo', capacidad: 50, linea: 'VALLEY' },
  { destino: 'Tonalá Chiapas', tipo: 'Foráneo', capacidad: 90, linea: 'LIBRA EXPRESS' },
  { destino: 'Tapachula', tipo: 'Foráneo', capacidad: 110, linea: 'VALLEY' },
  { destino: 'Matías Romero', tipo: 'HUB', capacidad: 110, linea: 'BRITO' },
  { destino: 'Pichucalco', tipo: 'Foráneo', capacidad: 50, linea: 'LTI - VHS' },
  { destino: 'Las Choapas', tipo: 'Foráneo', capacidad: 50, linea: 'LTI - VHS' },
  { destino: 'Huimanguillo', tipo: 'Foráneo', capacidad: 110, linea: 'LIBRA EXPRESS' },
]

export const MOVIMIENTOS_LABELS = [
  'Italikas',
  'Conectividad',
  'Colchones y Box',
  'Entretenimiento',
  'Muebles y Hogar',
  'LB Enseres',
] as const

export interface HeadcountRow {
  rol: string
  autorizado: number
  activo: number
  incapacidades: number
  vacaciones: number
  faltas: number
}

export const HEADCOUNT: HeadcountRow[] = [
  { rol: 'Op. Camioneta', autorizado: 14, activo: 14, incapacidades: 0, vacaciones: 0, faltas: 0 },
  { rol: 'Op. RM (Rango Medio)', autorizado: 24, activo: 23, incapacidades: 0, vacaciones: 0, faltas: 0 },
  { rol: 'Op. Tractor', autorizado: 7, activo: 7, incapacidades: 0, vacaciones: 0, faltas: 0 },
  { rol: 'Op. Fulles', autorizado: 6, activo: 5, incapacidades: 0, vacaciones: 0, faltas: 0 },
  { rol: 'Ayudantes', autorizado: 38, activo: 38, incapacidades: 2, vacaciones: 2, faltas: 0 },
]

function makeHistoryEntry(daysAgo: number, label: string): HistoryEntry {
  const date = new Date(Date.UTC(2026, 9, 1 - daysAgo, 18, 0, 0))
  return {
    id: `hist-${daysAgo}`,
    savedAt: date.toISOString(),
    planDate: date.toISOString().slice(0, 10),
    label,
    snapshot: { units: SEED_UNITS, trips: SEED_TRIPS },
  }
}

export const SEED_HISTORY: HistoryEntry[] = [
  makeHistoryEntry(1, 'Cierre de turno'),
  makeHistoryEntry(2, 'Cierre de turno'),
  makeHistoryEntry(3, 'Corte mediodía'),
  makeHistoryEntry(4, 'Cierre de turno'),
  makeHistoryEntry(5, 'Cierre de turno'),
]
