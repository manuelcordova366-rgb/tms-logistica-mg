'use client'

import { useState, type FormEvent } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFleet } from '@/lib/fleet-store'
import { PATIO_STATUS_LABEL, UNIT_KINDS, type PatioStatus, type Unit, type UnitKind } from '@/lib/fleet-data'
import { Field, NativeSelect, inputClass } from './form-fields'

/** Only these two kinds are registered by hand. */
const KINDS: UnitKind[] = UNIT_KINDS
const STATUSES: { value: PatioStatus; label: string }[] = (Object.keys(PATIO_STATUS_LABEL) as PatioStatus[]).map((value) => ({
  value,
  label: PATIO_STATUS_LABEL[value],
}))

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
  // A unit registered before this change keeps its kind selectable while editing.
  const kinds = unit && !KINDS.includes(unit.kind) ? [unit.kind, ...KINDS] : KINDS

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const eco = String(data.get('eco') ?? '').trim().toUpperCase()
    const placas = String(data.get('placas') ?? '').trim().toUpperCase()
    if (!eco) return setError('El ECO es obligatorio.')
    if (eco !== unit?.eco && unitByEco.has(eco)) return setError(`Ya existe la unidad ECO ${eco}.`)
    dispatch({
      type: 'upsertUnit',
      originalEco: unit?.eco,
      unit: {
        eco,
        placas,
        // Capacity is no longer captured here: keep the value the unit already had.
        capacidad: unit?.capacidad ?? 18,
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
        <Field label="Placas (opcional)" htmlFor="unit-placas">
          <Input id="unit-placas" name="placas" defaultValue={unit?.placas} placeholder="Sin placas" className={inputClass} />
        </Field>
        <Field label="Tipo" htmlFor="unit-kind">
          <NativeSelect id="unit-kind" name="kind" defaultValue={unit?.kind ?? 'Sencillo'}>
            {kinds.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </NativeSelect>
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
