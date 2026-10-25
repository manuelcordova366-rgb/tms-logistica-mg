import type { Trip, Unit } from './fleet-data'
import { downloadCsv } from './fleet-format'

const PATIO_LABEL: Record<Unit['patioStatus'], string> = {
  disponible: 'Disponible en Patio',
  ruta: 'Ruta asignada',
  colocado: 'Colocado p/ Carga',
  taller: 'Taller / Mtto',
}

export function exportPatio(units: Unit[], tripsByEco: Map<string, Trip[]>, planDate: string) {
  downloadCsv(
    `patio-${planDate}.csv`,
    ['ECO', 'Tipo', 'Placas', 'Capacidad m3', 'Estatus', 'Viajes', 'Destinos'],
    units.map((u) => {
      const trips = tripsByEco.get(u.eco) ?? []
      const status = u.patioStatus !== 'taller' && trips.length ? 'Cargado' : PATIO_LABEL[u.patioStatus]
      return [u.eco, u.kind, u.placas, u.capacidad, status, trips.map((t) => t.folio).join(' / '), trips.map((t) => t.destino).join(' / ')]
    }),
  )
}

export function exportTrips(name: string, trips: Trip[], unitByEco: Map<string, Unit>, planDate: string) {
  downloadCsv(
    `${name}-${planDate}.csv`,
    [
      'Viaje',
      'ECO',
      'Capacidad m3',
      'Operador',
      'Producto',
      'Destino',
      'Entregas adicionales',
      'Tipo',
      'Pipa',
      'Salida',
      'Tiempo est.',
      'ETA',
      'Estatus planeacion',
      'Estatus supervisor',
      'Regresa manana',
      'Observaciones',
    ],
    trips.map((t) => [
      t.folio ?? '',
      t.eco,
      unitByEco.get(t.eco)?.capacidad ?? '',
      t.operador,
      t.carga,
      t.destino,
      t.entregas.join(' | '),
      t.kind,
      t.pipa,
      t.salida,
      t.tiempoEst,
      t.eta,
      t.planStatus,
      t.supStatus,
      t.regresaManana ? 'SI' : 'NO',
      t.observaciones,
    ]),
  )
}
