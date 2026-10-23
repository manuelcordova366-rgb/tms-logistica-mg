'use client'

import { useState, type FormEvent } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { newTripId, useFleet } from '@/lib/fleet-store'
import type { PlanStatus, SupervisorStatus, Trip, TripKind } from '@/lib/fleet-data'
import { Field, NativeSelect, inputClass } from './form-fields'

const PLAN_STATUSES: PlanStatus[] = ['CARGADO', 'COLOCADO', 'PENDIENTE', 'NO SE CUBRE']
const SUP_STATUSES: SupervisorStatus[] = [
  'CARGADO',
  'EN RUTA',
  'EN SUCURSAL',
  'DESCARGANDO',
  'RETORNO',
  'ALERTA',
  'COMPLETADO',
  'CANCELADO',
  'REPROGRAMADO',
  'CONTINUACIÓN',
]

export interface TripDialogState {
  trip: Trip | null
  defaultEco?: string
}

export function TripDialog({
  state,
  onOpenChange,
}: {
  state: TripDialogState | null
  onOpenChange: (open: boolean) => void
}) {
  const open = state !== null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {state && <TripForm key={state.trip?.id ?? `new-${state.defaultEco}`} state={state} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function TripForm({ state, onDone }: { state: TripDialogState; onDone: () => void }) {
  const { dispatch, units, trips } = useFleet()
  const [error, setError] = useState('')
  const trip = state.trip
  const nextFolio = Math.max(0, ...trips.map((t) => t.folio ?? 0)) + 1

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const get = (k: string) => String(d.get(k) ?? '').trim()
    const eco = get('eco')
    const destino = get('destino')
    if (!eco) return setError('Selecciona una unidad.')
    if (!destino) return setError('El destino es obligatorio.')
    const folioRaw = get('folio')
    const folio = folioRaw ? Number(folioRaw) : null
    if (folio !== null && (!Number.isInteger(folio) || folio <= 0)) return setError('El folio debe ser un número entero positivo.')

    dispatch({
      type: 'upsertTrip',
      trip: {
        id: trip?.id ?? newTripId(),
        folio,
        eco,
        operador: get('operador').toUpperCase() || 'POR ASIGNAR',
        turno: get('turno') || 'M1',
        carga: get('carga').toUpperCase(),
        destino,
        entregas: get('entregas')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        kind: get('kind') as TripKind,
        cluster: get('cluster').toUpperCase(),
        salida: get('salida'),
        tiempoEst: get('tiempoEst') || '—',
        eta: get('eta'),
        rampa: get('rampa'),
        planStatus: get('planStatus') as PlanStatus,
        supStatus: get('supStatus') as SupervisorStatus,
        regresaManana: d.get('regresaManana') === 'on',
        noRegresaDias: trip?.noRegresaDias,
        observaciones: get('observaciones'),
      },
    })
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">{trip ? `Editar Viaje #${trip.folio ?? '—'}` : 'Nuevo Viaje'}</DialogTitle>
        <DialogDescription>Asignación de unidad, operador, carga y destino del embarque.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Field label="Folio viaje" htmlFor="t-folio">
          <Input id="t-folio" name="folio" type="number" min={1} defaultValue={trip ? (trip.folio ?? '') : nextFolio} className={inputClass} />
        </Field>
        <Field label="Unidad (ECO)" htmlFor="t-eco">
          <NativeSelect id="t-eco" name="eco" defaultValue={trip?.eco ?? state.defaultEco ?? ''}>
            <option value="">Seleccionar…</option>
            {units.map((u) => (
              <option key={u.eco} value={u.eco} disabled={u.patioStatus === 'taller'}>
                {u.eco} · {u.kind} · {u.capacidad} m³{u.patioStatus === 'taller' ? ' (Taller)' : ''}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="# Carga" htmlFor="t-carga">
          <Input id="t-carga" name="carga" defaultValue={trip?.carga} placeholder="CS00000000" className={inputClass} />
        </Field>
        <Field label="Operador" htmlFor="t-op" className="col-span-2">
          <Input id="t-op" name="operador" defaultValue={trip?.operador === 'POR ASIGNAR' ? '' : trip?.operador} className={inputClass} />
        </Field>
        <Field label="Turno" htmlFor="t-turno">
          <Input id="t-turno" name="turno" defaultValue={trip?.turno ?? 'M1'} className={inputClass} />
        </Field>
        <Field label="Destino / Sucursal" htmlFor="t-dest" className="col-span-2">
          <Input id="t-dest" name="destino" defaultValue={trip?.destino} required className={inputClass} />
        </Field>
        <Field label="Tipo" htmlFor="t-kind">
          <NativeSelect id="t-kind" name="kind" defaultValue={trip?.kind ?? 'LOCAL'}>
            <option value="LOCAL">LOCAL</option>
            <option value="FORÁNEO">FORÁNEO</option>
          </NativeSelect>
        </Field>
        <Field label="Clóster" htmlFor="t-cluster">
          <Input id="t-cluster" name="cluster" defaultValue={trip?.cluster ?? ''} placeholder="Escribir clóster" className={inputClass} />
        </Field>
        <Field label="Salida" htmlFor="t-salida">
          <Input id="t-salida" name="salida" type="time" defaultValue={trip?.salida} className={inputClass} />
        </Field>
        <Field label="Cajón / Rampa" htmlFor="t-rampa">
          <Input id="t-rampa" name="rampa" defaultValue={trip?.rampa} className={inputClass} />
        </Field>
        <Field label="Tiempo est." htmlFor="t-test">
          <Input id="t-test" name="tiempoEst" defaultValue={trip?.tiempoEst === '—' ? '' : trip?.tiempoEst} placeholder="2h 30m" className={inputClass} />
        </Field>
        <Field label="ETA" htmlFor="t-eta">
          <Input id="t-eta" name="eta" type="time" defaultValue={trip?.eta} className={inputClass} />
        </Field>
        <Field label="Estatus planeación" htmlFor="t-plan">
          <NativeSelect id="t-plan" name="planStatus" defaultValue={trip?.planStatus ?? 'CARGADO'}>
            {PLAN_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Estatus supervisor" htmlFor="t-sup">
          <NativeSelect id="t-sup" name="supStatus" defaultValue={trip?.supStatus ?? 'CARGADO'}>
            {SUP_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </NativeSelect>
        </Field>
        <label className="col-span-2 flex items-center gap-2 self-end pb-2 text-sm md:col-span-3">
          <input type="checkbox" name="regresaManana" defaultChecked={trip?.regresaManana} className="size-4 accent-primary" />
          Regresa mañana (disponible para el plan siguiente)
        </label>
        <Field label="Entregas adicionales (una por línea)" htmlFor="t-entregas" className="col-span-2 md:col-span-3">
          <Textarea id="t-entregas" name="entregas" rows={3} defaultValue={trip?.entregas.join('\n')} className="bg-background" />
        </Field>
        <Field label="Observaciones / Bitácora" htmlFor="t-obs" className="col-span-2 md:col-span-3">
          <Textarea id="t-obs" name="observaciones" rows={2} defaultValue={trip?.observaciones} className="bg-background" />
        </Field>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <DialogFooter className="bg-secondary/50">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit">{trip ? 'Guardar cambios' : 'Crear viaje'}</Button>
      </DialogFooter>
    </form>
  )
}
