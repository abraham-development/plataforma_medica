'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  House,
  Laptop,
  LoaderCircle,
} from 'lucide-react'

type ConsultationMode = 'VIRTUAL' | 'HOME_VISIT'
type AvailabilitySlot = {
  availabilityDate: string
  startTime: string
  endTime: string
  consultationMode: ConsultationMode
}
type AvailabilityRecord = {
  availability_date: string
  start_time: string
  end_time: string
  consultation_mode: ConsultationMode
}

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const monthFormatter = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' })
const selectedDateFormatter = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

function limaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

function keyFromParts(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

function addDays(key: string, amount: number) {
  const date = dateFromKey(key)
  date.setDate(date.getDate() + amount)
  return keyFromParts(date.getFullYear(), date.getMonth(), date.getDate())
}

function timeLabel(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

const selectableTimes = Array.from({ length: 28 }, (_, index) => {
  const startMinutes = 7 * 60 + index * 30
  return { start: timeLabel(startMinutes), end: timeLabel(startMinutes + 30) }
})

function accessToken() {
  const rawToken = document.cookie
    .split('; ')
    .find((item) => item.startsWith('insforge_access_token='))
    ?.split('=')[1]
  return decodeURIComponent(rawToken ?? '')
}

export function AvailabilityForm() {
  const today = useMemo(() => limaDateKey(), [])
  const lastSelectableDay = useMemo(() => addDays(today, 60), [today])
  const initialDate = dateFromKey(today)
  const [visibleMonth, setVisibleMonth] = useState({
    year: initialDate.getFullYear(),
    month: initialDate.getMonth(),
  })
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedMode, setSelectedMode] = useState<ConsultationMode | null>(null)
  const [allowedModes, setAllowedModes] = useState<ConsultationMode[]>([])
  const [items, setItems] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeKind, setNoticeKind] = useState<'success' | 'error'>('success')

  useEffect(() => {
    const token = accessToken()
    async function load() {
      try {
        const [availabilityResponse, profileResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/doctors/me/availability`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/doctor-profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        if (!availabilityResponse.ok) throw new Error('No pudimos cargar tu disponibilidad.')
        const records = (await availabilityResponse.json()) as AvailabilityRecord[]
        setItems(
          records.map((record) => ({
            availabilityDate: record.availability_date,
            startTime: record.start_time.slice(0, 5),
            endTime: record.end_time.slice(0, 5),
            consultationMode: record.consultation_mode,
          })),
        )
        if (profileResponse.ok) {
          const profile = (await profileResponse.json()) as {
            offers_virtual?: boolean
            offers_home_visit?: boolean
          }
          const modes: ConsultationMode[] = []
          if (profile.offers_virtual) modes.push('VIRTUAL')
          if (profile.offers_home_visit) modes.push('HOME_VISIT')
          setAllowedModes(modes)
          setSelectedMode(modes[0] ?? null)
          setItems((current) =>
            current.filter((item) => modes.includes(item.consultationMode)),
          )
        }
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'No pudimos cargar tu disponibilidad.')
        setNoticeKind('error')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const daysInMonth = new Date(visibleMonth.year, visibleMonth.month + 1, 0).getDate()
  const leadingBlankDays = (new Date(visibleMonth.year, visibleMonth.month, 1).getDay() + 6) % 7
  const calendarCells = Array.from(
    { length: leadingBlankDays + daysInMonth },
    (_, index) => (index < leadingBlankDays ? null : index - leadingBlankDays + 1),
  )
  const selectedDateValue = dateFromKey(selectedDate)
  const currentMonthStart = today.slice(0, 7)
  const visibleMonthKey = keyFromParts(visibleMonth.year, visibleMonth.month, 1).slice(0, 7)
  const nextMonthDate = new Date(visibleMonth.year, visibleMonth.month + 1, 1)
  const nextMonthKey = keyFromParts(
    nextMonthDate.getFullYear(),
    nextMonthDate.getMonth(),
    1,
  ).slice(0, 7)
  const lastMonthKey = lastSelectableDay.slice(0, 7)

  function moveMonth(amount: number) {
    const date = new Date(visibleMonth.year, visibleMonth.month + amount, 1)
    setVisibleMonth({ year: date.getFullYear(), month: date.getMonth() })
  }

  function toggleSlot(startTime: string, endTime: string) {
    if (!selectedMode) return
    setNotice('')
    setItems((current) => {
      const exists = current.some(
        (item) =>
          item.availabilityDate === selectedDate &&
          item.startTime === startTime &&
          item.consultationMode === selectedMode,
      )
      if (exists) {
        return current.filter(
          (item) =>
            !(
              item.availabilityDate === selectedDate &&
              item.startTime === startTime &&
              item.consultationMode === selectedMode
            ),
        )
      }
      return [
        ...current,
        { availabilityDate: selectedDate, startTime, endTime, consultationMode: selectedMode },
      ]
    })
  }

  function clearSelectedDay() {
    setItems((current) =>
      current.filter(
        (item) =>
          !(item.availabilityDate === selectedDate && item.consultationMode === selectedMode),
      ),
    )
  }

  async function save() {
    if (!allowedModes.length) {
      setNotice('Activa al menos una modalidad en tu perfil profesional antes de publicar horarios.')
      setNoticeKind('error')
      return
    }
    setSaving(true)
    setNotice('')
    const sortedItems = [...items].sort((a, b) =>
      `${a.availabilityDate}-${a.startTime}-${a.consultationMode}`.localeCompare(
        `${b.availabilityDate}-${b.startTime}-${b.consultationMode}`,
      ),
    )
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/doctors/me/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken()}`,
        },
        body: JSON.stringify({ items: sortedItems }),
      })
      const data = (await response.json()) as { message?: string }
      if (!response.ok) {
        const message = data.message?.includes('CONSULTATION_MODE_NOT_OFFERED')
          ? 'Uno de los horarios usa una modalidad desactivada en tu perfil profesional.'
          : (data.message ?? 'No pudimos guardar la disponibilidad.')
        throw new Error(message)
      }
      setNotice('Disponibilidad guardada. Los pacientes ya podrán ver estos horarios.')
      setNoticeKind('success')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No pudimos guardar la disponibilidad.')
      setNoticeKind('error')
    } finally {
      setSaving(false)
    }
  }

  const selectedModeSlots = items.filter(
    (item) => item.availabilityDate === selectedDate && item.consultationMode === selectedMode,
  )
  const configuredDates = new Set(items.map((item) => item.availabilityDate)).size

  return (
    <div className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
        <section className="border-b p-4 sm:p-7 lg:border-b-0 lg:border-r" aria-label="Calendario">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-mint">Calendario de disponibilidad</p>
              <h2 className="mt-1 text-xl font-black capitalize sm:text-2xl">
                {monthFormatter.format(new Date(visibleMonth.year, visibleMonth.month, 1))}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                aria-label="Mes anterior"
                className="btn-secondary !p-2.5 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={visibleMonthKey <= currentMonthStart}
                onClick={() => moveMonth(-1)}
                type="button"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                aria-label="Mes siguiente"
                className="btn-secondary !p-2.5 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={nextMonthKey > lastMonthKey}
                onClick={() => moveMonth(1)}
                type="button"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-7 gap-1 text-center sm:gap-2">
            {weekDays.map((day) => (
              <span className="pb-2 text-xs font-bold uppercase tracking-wide text-slate-400" key={day}>
                {day}
              </span>
            ))}
            {calendarCells.map((day, index) => {
              if (day === null) return <span aria-hidden="true" key={`blank-${index}`} />
              const dateKey = keyFromParts(visibleMonth.year, visibleMonth.month, day)
              const disabled = dateKey < today || dateKey > lastSelectableDay
              const selected = dateKey === selectedDate
              const dayItems = items.filter((item) => item.availabilityDate === dateKey)
              return (
                <button
                  aria-label={`${day} de ${monthFormatter.format(new Date(visibleMonth.year, visibleMonth.month, 1))}${
                    dayItems.length ? `, ${dayItems.length} horarios configurados` : ''
                  }`}
                  className={`relative min-h-11 rounded-lg border text-xs font-bold transition sm:min-h-16 sm:rounded-xl sm:text-sm ${
                    selected
                      ? 'border-mint bg-mint text-white shadow-md'
                      : dayItems.length
                        ? 'border-emerald-200 bg-emerald-50 text-ink hover:border-mint'
                        : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-cloud'
                  } disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300`}
                  disabled={disabled}
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  type="button"
                >
                  {day}
                  {dayItems.length > 0 && (
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                        selected ? 'bg-white' : 'bg-mint'
                      }`}
                    />
                  )}
                </button>
              )
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-mint" /> Día con horarios
            </span>
            <span>Puedes configurar hasta 60 días hacia adelante.</span>
          </div>
        </section>

        <section className="p-4 sm:p-7" aria-label="Horarios del día seleccionado">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-mint">
              <CalendarDays size={23} />
            </span>
            <div>
              <p className="text-sm text-slate-500">Configura las horas para</p>
              <h2 className="text-xl font-black capitalize">
                {selectedDateFormatter.format(selectedDateValue)}
              </h2>
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className="label">Modalidad</legend>
            {allowedModes.length === 0 && !loading ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-bold">Aún no tienes modalidades activas.</p>
                <p className="mt-1">Activa consulta virtual o atención a domicilio para publicar horarios.</p>
                <Link className="mt-3 inline-flex font-bold text-ocean underline" href="/medico/perfil">
                  Ir a Perfil profesional
                </Link>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {allowedModes.includes('VIRTUAL') && (
                <button
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold ${
                    selectedMode === 'VIRTUAL'
                      ? 'border-ocean bg-sky-50 text-ocean'
                      : 'border-slate-200 bg-white'
                  }`}
                  onClick={() => setSelectedMode('VIRTUAL')}
                  type="button"
                >
                  <Laptop size={18} /> Consulta virtual
                </button>
              )}
              {allowedModes.includes('HOME_VISIT') && (
                <button
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold ${
                    selectedMode === 'HOME_VISIT'
                      ? 'border-mint bg-emerald-50 text-mint'
                      : 'border-slate-200 bg-white'
                  }`}
                  onClick={() => setSelectedMode('HOME_VISIT')}
                  type="button"
                >
                  <House size={18} /> A domicilio
                </button>
              )}
              </div>
            )}
          </fieldset>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <p className="label !mb-0">Selecciona bloques de 30 minutos</p>
              {selectedModeSlots.length > 0 && (
                <button className="text-xs font-bold text-coral" onClick={clearSelectedDay} type="button">
                  Limpiar
                </button>
              )}
            </div>
            {loading ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-cloud p-4 text-sm text-slate-500">
                <LoaderCircle className="animate-spin" size={18} /> Cargando horarios…
              </div>
            ) : !selectedMode ? (
              <div className="mt-4 rounded-xl bg-cloud p-4 text-sm text-slate-500">
                Activa una modalidad en tu perfil para seleccionar horas.
              </div>
            ) : (
              <div className="mt-3 grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1 min-[380px]:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
                {selectableTimes.map((time) => {
                  const active = selectedModeSlots.some((item) => item.startTime === time.start)
                  return (
                    <button
                      aria-pressed={active}
                      className={`rounded-lg border px-2 py-2.5 text-sm font-bold transition ${
                        active
                          ? 'border-mint bg-mint text-white'
                          : 'border-slate-200 bg-white hover:border-mint hover:text-mint'
                      }`}
                      key={time.start}
                      onClick={() => toggleSlot(time.start, time.end)}
                      type="button"
                    >
                      {time.start}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="flex flex-col gap-4 border-t bg-cloud/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <p className="font-bold">
            {items.length} {items.length === 1 ? 'horario' : 'horarios'} en {configuredDates}{' '}
            {configuredDates === 1 ? 'día' : 'días'}
          </p>
          <p className="text-sm text-slate-500">Guarda para publicar los cambios a los pacientes.</p>
        </div>
        <button
          className="btn-primary sm:min-w-56 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading || saving || allowedModes.length === 0}
          onClick={save}
          type="button"
        >
          {saving && <LoaderCircle className="animate-spin" size={18} />}
          {saving ? 'Guardando…' : 'Guardar disponibilidad'}
        </button>
      </footer>
      {notice && (
        <p
          className={`border-t px-5 py-4 text-sm font-semibold sm:px-7 ${
            noticeKind === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
          }`}
          role="status"
        >
          {notice}
        </p>
      )}
    </div>
  )
}
