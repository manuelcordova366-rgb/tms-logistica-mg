import type { PillTone } from '@/components/fleet/primitives'
import type { SupervisorStatus } from './fleet-data'

export const SUP_RESUMEN: Record<SupervisorStatus, { label: string; tone: PillTone }> = {
  CARGADO: { label: 'EN CASETA (SALIDA)', tone: 'warning' },
  'EN RUTA': { label: 'EN RUTA', tone: 'primary' },
  'EN SUCURSAL': { label: 'EN SUCURSAL', tone: 'warning-outline' },
  DESCARGANDO: { label: 'DESCARGANDO', tone: 'primary' },
  RETORNO: { label: 'RETORNO', tone: 'violet' },
  ALERTA: { label: 'RETRASADO / ALERTA', tone: 'danger' },
  COMPLETADO: { label: 'COMPLETADO', tone: 'success' },
  CANCELADO: { label: 'CANCELADO', tone: 'danger' },
  REPROGRAMADO: { label: 'REPROGRAMADO', tone: 'warning-outline' },
  CONTINUACIÓN: { label: 'CONTINUACIÓN', tone: 'violet' },
}

export const SUP_SUPERVISOR: Record<SupervisorStatus, { label: string; tone: PillTone }> = {
  ...SUP_RESUMEN,
  CARGADO: { label: 'CARGADO (CASETA)', tone: 'warning' },
}

export const IN_TRANSIT: SupervisorStatus[] = ['EN RUTA', 'EN SUCURSAL', 'DESCARGANDO', 'RETORNO', 'ALERTA']
