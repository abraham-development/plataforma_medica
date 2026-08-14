'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock3, House, Laptop, Sparkles } from 'lucide-react'
import type { ConsultationMode } from '@/lib/demo-doctors'

type AvailableSlot = { startsAt: string; consultationMode: ConsultationMode }

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Lima',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const fullDateFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const timeFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function dateKey(value: string) {
  const parts = dateKeyFormatter.formatToParts(new Date(value))
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function DemoBookingPanel({
  doctorName,
  offersVirtual,
  offersHomeVisit,
  availableSlots,
}: {
  doctorName: string
  offersVirtual: boolean
  offersHomeVisit: boolean
  availableSlots: AvailableSlot[]
}) {
  const initialMode: ConsultationMode = offersVirtual ? 'VIRTUAL' : 'HOME_VISIT'
  const [mode, setMode] = useState<ConsultationMode>(initialMode)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedStart, setSelectedStart] = useState('')
  const [showNextStep, setShowNextStep] = useState(false)

  const modeSlots = useMemo(
    () =>
      availableSlots
        .filter((slot) => slot.consultationMode === mode)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [availableSlots, mode],
  )
  const availableDates = useMemo(
    () => Array.from(new Set(modeSlots.map((slot) => dateKey(slot.startsAt)))),
    [modeSlots],
  )
  const slotsForDate = modeSlots.filter((slot) => dateKey(slot.startsAt) === selectedDate)

  useEffect(() => {
    const firstDate = availableDates[0] ?? ''
    setSelectedDate(firstDate)
    setSelectedStart(modeSlots.find((slot) => dateKey(slot.startsAt) === firstDate)?.startsAt ?? '')
    setShowNextStep(false)
  }, [availableDates, modeSlots])

  function chooseDate(value: string) {
    setSelectedDate(value)
    setSelectedStart(modeSlots.find((slot) => dateKey(slot.startsAt) === value)?.startsAt ?? '')
    setShowNextStep(false)
  }

  return (
    <aside className="card self-start overflow-hidden lg:sticky lg:top-40">
      <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 to-sky-50 p-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-black text-mint shadow-sm">
          <Sparkles size={14} /> Agenda interactiva de muestra
        </span>
        <h2 className="mt-4 text-2xl font-black">Consulta la disponibilidad</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Prueba cómo un paciente elegiría modalidad, fecha y hora.
        </p>
      </div>

      <div className="grid gap-6 p-4 sm:p-6">
        <fieldset>
          <legend className="label">1. Modalidad</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {offersVirtual && (
              <button
                aria-pressed={mode === 'VIRTUAL'}
                className={`rounded-xl border p-3 text-left text-sm font-bold transition ${
                  mode === 'VIRTUAL'
                    ? 'border-ocean bg-sky-50 text-ocean'
                    : 'border-slate-200 hover:border-ocean'
                }`}
                onClick={() => setMode('VIRTUAL')}
                type="button"
              >
                <Laptop className="mb-2" size={19} /> Virtual
              </button>
            )}
            {offersHomeVisit && (
              <button
                aria-pressed={mode === 'HOME_VISIT'}
                className={`rounded-xl border p-3 text-left text-sm font-bold transition ${
                  mode === 'HOME_VISIT'
                    ? 'border-mint bg-emerald-50 text-mint'
                    : 'border-slate-200 hover:border-mint'
                }`}
                onClick={() => setMode('HOME_VISIT')}
                type="button"
              >
                <House className="mb-2" size={19} /> A domicilio
              </button>
            )}
          </div>
        </fieldset>

        <div>
          <p className="label">2. Fecha</p>
          <div className="grid grid-cols-2 gap-2">
            {availableDates.map((value) => {
              const sample = modeSlots.find((slot) => dateKey(slot.startsAt) === value)
              return (
                <button
                  aria-pressed={selectedDate === value}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-bold capitalize ${
                    selectedDate === value
                      ? 'border-mint bg-emerald-50 text-mint'
                      : 'border-slate-200 hover:border-mint'
                  }`}
                  key={value}
                  onClick={() => chooseDate(value)}
                  type="button"
                >
                  {sample ? dateFormatter.format(new Date(sample.startsAt)) : value}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="label">3. Hora</p>
          <div className="grid grid-cols-3 gap-2">
            {slotsForDate.map((slot) => (
              <button
                aria-pressed={selectedStart === slot.startsAt}
                className={`rounded-lg border px-2 py-2.5 text-sm font-black ${
                  selectedStart === slot.startsAt
                    ? 'border-mint bg-mint text-white'
                    : 'border-slate-200 hover:border-mint'
                }`}
                key={slot.startsAt}
                onClick={() => {
                  setSelectedStart(slot.startsAt)
                  setShowNextStep(false)
                }}
                type="button"
              >
                {timeFormatter.format(new Date(slot.startsAt))}
              </button>
            ))}
          </div>
        </div>

        {selectedStart && (
          <div className="rounded-xl bg-cloud p-4 text-sm">
            <p className="flex items-center gap-2 font-black text-ink">
              <CalendarDays className="text-mint" size={17} /> Tu selección
            </p>
            <p className="mt-2 capitalize text-slate-600">
              {fullDateFormatter.format(new Date(selectedStart))}
            </p>
            <p className="mt-1 flex items-center gap-2 font-bold text-slate-700">
              <Clock3 size={16} /> {timeFormatter.format(new Date(selectedStart))} ·{' '}
              {mode === 'VIRTUAL' ? 'Consulta virtual' : 'Atención a domicilio'}
            </p>
          </div>
        )}

        {!showNextStep ? (
          <button
            className="btn-primary w-full"
            disabled={!selectedStart}
            onClick={() => setShowNextStep(true)}
            type="button"
          >
            Continuar con este horario
          </button>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <CheckCircle2 className="text-mint" size={27} />
            <h3 className="mt-3 font-black">Horario seleccionado</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Este es un perfil demostrativo. Crea una cuenta para reservar con los profesionales
              reales que publiquen su agenda en MediCerca.
            </p>
            <div className="mt-4 grid gap-2">
              <Link className="btn-primary w-full" href="/registro">
                Crear cuenta de paciente
              </Link>
              <Link className="btn-secondary w-full" href="/login">
                Ya tengo una cuenta
              </Link>
            </div>
          </div>
        )}

        <p className="text-center text-xs leading-5 text-slate-500">
          Selección de muestra con {doctorName}. No genera una cita real.
        </p>
      </div>
    </aside>
  )
}
