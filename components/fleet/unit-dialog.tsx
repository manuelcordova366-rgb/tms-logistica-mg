'use client'

import { useState, type FormEvent } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFleet } from '@/lib/fleet-store'
import type { PatioStatus, Unit, UnitKind } from '@/lib/fleet-data'
import { Field, NativeSelect, inputClass } from './form-fields'

const KINDS: UnitKind[] = ['Camioneta', 'Rango Medio', 'Sencillo', 'Tracto / Full']
const STATUSES: { value: PatioStatus; label: string }[] = [
  { value: 'disponible', label: 'Disponible en Patio' },
  { value: 'ruta', label: 'Ruta asignada' },
  { value: 'colocado', label: 'Colocado p/ Carga' },
  { value: 'taller', label: 'Taller / Mtto' },
]

export function UnitDialog({ unit, open, onOpenChange }: { unit: Unit | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <UnitForm key={unit?.eco ?? 'new'} unit={unit} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function UnitForm({ unit, onDone }: { unit: Unit | null; onDone: () => void }) {
  const { dispatch, unitByEco } = useFleet()
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const eco = String(data.get('eco') ?? '').trim().toUpperCase()
    const placas = String(data.get('placas') ?? '').trim().toUpperCase()
    const capacidad = Number(data.get('capacidad'))
    if (!eco || !placas) return setError('ECO y placas son obligatorios.')
    if (!Number.isFinite(capacidad) || capacidad <= 0 || capacidad > 500) return setError('Capacidad inválida (1 - 500 m³).')
    if (eco !== unit?.eco && unitByEco.has(eco)) return setError(`Ya existe la unidad ECO ${eco}.`)
    dispatch({
      type: 'upsertUnit',
      originalEco: unit?.eco,
      unit: {
        eco,
        placas,
        capacidad,
        kind: String(data.get('kind')) as UnitKind,
        patioStatus: String(data.get('status')) as PatioStatus,
      },
    })
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">{unit ? `Editar ECO ${unit.eco}` : 'Registrar Unidad en Patio'}</DialogTitle>
        <DialogDescription>Datos de la unidad y su estatus actual en el CD.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <Field label="ECO" htmlFor="unit-eco">
          <Input id="unit-eco" name="eco" defaultValue={unit?.eco} required className={inputClass} />
        </Field>
        <Field label="Placas" htmlFor="unit-placas">
          <Input id="unit-placas" name="placas" defaultValue={unit?.placas} required className={inputClass} />
        </Field>
        <Field label="Tipo" htmlFor="unit-kind">
          <NativeSelect id="unit-kind" name="kind" defaultValue={unit?.kind ?? 'Camioneta'}>
            {KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Capacidad (m³)" htmlFor="unit-cap">
          <Input id="unit-cap" name="capacidad" type="number" min={1} max={500} defaultValue={unit?.capacidad ?? 18} className={inputClass} />
        </Field>
        <Field label="Estatus en patio" htmlFor="unit-status" className="col-span-2">
          <NativeSelect id="unit-status" name="status" defaultValue={unit?.patioStatus ?? 'disponible'}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </NativeSelect>
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
        <Button type="submit">{unit ? 'Guardar cambios' : 'Registrar'}</Button>
      </DialogFooter>
    </form>
  )
}
