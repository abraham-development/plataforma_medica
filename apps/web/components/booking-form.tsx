'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { House, Laptop, LoaderCircle } from 'lucide-react'
import { authenticatedApiFetch, handleSessionError } from '@/lib/insforge/authenticated-fetch'

type District = { id: string; name: string; province: string }
type ConsultationMode = 'VIRTUAL' | 'HOME_VISIT'
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

export function BookingForm({
  doctorId,
  offersVirtual,
  offersHomeVisit,
  districts,
  availableSlots,
}: {
  doctorId: string
  offersVirtual: boolean
  offersHomeVisit: boolean
  districts: District[]
  availableSlots: AvailableSlot[]
}) {
  const router = useRouter()
  const initialMode = offersVirtual ? 'VIRTUAL' : 'HOME_VISIT'
  const [mode, setMode] = useState<ConsultationMode>(initialMode)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
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
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedStart, setSelectedStart] = useState('')

  useEffect(() => {
    const firstDate = availableDates[0] ?? ''
    setSelectedDate(firstDate)
    setSelectedStart(modeSlots.find((slot) => dateKey(slot.startsAt) === firstDate)?.startsAt ?? '')
  }, [availableDates, modeSlots])

  const slotsForSelectedDate = modeSlots.filter((slot) => dateKey(slot.startsAt) === selectedDate)

  function chooseDate(value: string) {
    setSelectedDate(value)
    setSelectedStart(modeSlots.find((slot) => dateKey(slot.startsAt) === value)?.startsAt ?? '')
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedStart) {
      setNotice('Selecciona un horario disponible.')
      return
    }
    setPending(true)
    setNotice('')
    const form = new FormData(event.currentTarget)
    try {
      const response = await authenticatedApiFetch('/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          startsAt: selectedStart,
          consultationMode: mode,
          ...(mode === 'HOME_VISIT'
            ? {
                districtId: form.get('districtId'),
                address: form.get('address'),
                addressReference: form.get('addressReference'),
              }
            : {}),
        }),
      })
      const result = (await response.json()) as { message?: string | string[] }
      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(', ')
            : (result.message ?? 'No pudimos reservar ese horario.'),
        )
      }
      setNotice('¡Cita confirmada! Ya aparece en tu panel.')
      setTimeout(() => router.push('/paciente/citas'), 900)
    } catch (error) {
      if (!handleSessionError(error)) {
        setNotice(error instanceof Error ? error.message : 'No pudimos reservar ese horario.')
      }
    } finally {
      setPending(false)
    }
  }
  return (
    <form onSubmit={submit} className="card grid gap-5 p-4 sm:p-6">
      <h2 className="text-2xl font-black">Reserva tu cita</h2>
      <fieldset>
        <legend className="label">Modalidad</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {offersVirtual && (
            <label className="cursor-pointer rounded-xl border p-4 has-[:checked]:border-mint has-[:checked]:bg-emerald-50">
              <input
                type="radio"
                name="mode"
                checked={mode === 'VIRTUAL'}
                onChange={() => setMode('VIRTUAL')}
              />{' '}
              <Laptop className="ml-2 inline" size={18} /> <b>Consulta virtual</b>
            </label>
          )}
          {offersHomeVisit && (
            <label className="cursor-pointer rounded-xl border p-4 has-[:checked]:border-mint has-[:checked]:bg-emerald-50">
              <input
                type="radio"
                name="mode"
                checked={mode === 'HOME_VISIT'}
                onChange={() => setMode('HOME_VISIT')}
              />{' '}
              <House className="ml-2 inline" size={18} /> <b>Atención a domicilio</b>
            </label>
          )}
        </div>
      </fieldset>
      <div>
        <p className="label">Fecha disponible</p>
        {availableDates.length ? (
          <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto pr-1">
            {availableDates.map((value) => {
              const example = modeSlots.find((slot) => dateKey(slot.startsAt) === value)
              return (
                <button
                  aria-pressed={selectedDate === value}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-bold capitalize ${
                    selectedDate === value
                      ? 'border-mint bg-emerald-50 text-mint'
                      : 'border-slate-200 bg-white'
                  }`}
                  key={value}
                  onClick={() => chooseDate(value)}
                  type="button"
                >
                  {example ? dateFormatter.format(new Date(example.startsAt)) : value}
                </button>
              )
            })}
          </div>
        ) : (
          <p className="rounded-xl bg-cloud p-4 text-sm text-slate-600">
            El médico aún no publicó horarios para esta modalidad.
          </p>
        )}
      </div>
      {slotsForSelectedDate.length > 0 && (
        <div>
          <p className="label">Hora</p>
          <div className="grid grid-cols-3 gap-2">
            {slotsForSelectedDate.map((slot) => (
              <button
                aria-pressed={selectedStart === slot.startsAt}
                className={`rounded-lg border px-2 py-2.5 text-sm font-bold ${
                  selectedStart === slot.startsAt
                    ? 'border-mint bg-mint text-white'
                    : 'border-slate-200 bg-white hover:border-mint'
                }`}
                key={slot.startsAt}
                onClick={() => setSelectedStart(slot.startsAt)}
                type="button"
              >
                {timeFormatter.format(new Date(slot.startsAt))}
              </button>
            ))}
          </div>
        </div>
      )}
      {mode === 'HOME_VISIT' && (
        <>
          <div>
            <label className="label" htmlFor="districtId">
              Distrito
            </label>
            <select className="field" id="districtId" name="districtId" required>
              <option value="">Selecciona tu distrito</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name} ({district.province === 'CALLAO' ? 'Callao' : 'Lima'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="address">
              Dirección
            </label>
            <input
              className="field"
              id="address"
              name="address"
              minLength={5}
              maxLength={250}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="addressReference">
              Referencia para llegar
            </label>
            <textarea
              className="field"
              id="addressReference"
              name="addressReference"
              minLength={3}
              maxLength={250}
              required
              rows={3}
            />
          </div>
        </>
      )}{' '}
      {notice && (
        <p role="status" className="rounded-xl bg-cloud p-3 text-sm">
          {notice}
        </p>
      )}
      <button className="btn-primary" disabled={pending || !selectedStart}>
        {pending && <LoaderCircle className="animate-spin" size={18} />} Confirmar reserva
      </button>
    </form>
  )
}
