'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, House, Laptop } from 'lucide-react'
import { insforge } from '@/lib/insforge/client'

type Appointment = {
  id: string
  consultation_mode: 'VIRTUAL' | 'HOME_VISIT'
  starts_at: string
  ends_at: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  address: string | null
  address_reference: string | null
  virtual_meeting_url: string | null
}

const statusLabels: Record<Appointment['status'], string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
  NO_SHOW: 'No asistió',
}

export function AppointmentList() {
  const [items, setItems] = useState<Appointment[]>([])
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR' | 'ADMIN' | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const { data: user } = await insforge.auth.getCurrentUser()
    if (!user.user) {
      setLoading(false)
      return
    }
    const [appointments, roles] = await Promise.all([
      insforge.database
        .from('appointments')
        .select(
          'id,consultation_mode,starts_at,ends_at,status,address,address_reference,virtual_meeting_url',
        )
        .order('starts_at', { ascending: false })
        .limit(100),
      insforge.database.from('user_roles').select('role').eq('user_id', user.user.id),
    ])
    if (appointments.error) setError(appointments.error.message)
    else setItems((appointments.data ?? []) as Appointment[])
    const availableRoles = (roles.data ?? []) as { role: 'PATIENT' | 'DOCTOR' | 'ADMIN' }[]
    setRole(
      availableRoles.find((value) => value.role === 'DOCTOR')?.role ??
        availableRoles[0]?.role ??
        null,
    )
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  async function call(id: string, path: 'cancel' | 'outcome', body: object) {
    setBusy(id)
    setError('')
    const token = document.cookie
      .split('; ')
      .find((item) => item.startsWith('insforge_access_token='))
      ?.split('=')[1]
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments/${id}/${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${decodeURIComponent(token ?? '')}`,
      },
      body: JSON.stringify(body),
    })
    const result = (await response.json()) as { message?: string | string[] }
    if (!response.ok)
      setError(
        Array.isArray(result.message)
          ? result.message.join(', ')
          : (result.message ?? 'No se pudo actualizar la cita.'),
      )
    else await load()
    setBusy(null)
  }

  function cancel(item: Appointment) {
    const reason =
      role === 'DOCTOR' ? window.prompt('Indica el motivo de la cancelación:') : undefined
    if (role === 'DOCTOR' && (!reason || reason.trim().length < 3)) return
    void call(item.id, 'cancel', { reason })
  }

  if (loading) return <div className="card animate-pulse p-8 text-slate-500">Cargando citas…</div>
  if (!items.length)
    return (
      <div className="card p-8 text-center">
        <CalendarDays className="mx-auto text-mint" size={36} />
        <h2 className="mt-4 text-xl font-bold">Aún no tienes citas</h2>
        <p className="mt-2 text-slate-600">Busca un médico y elige un horario disponible.</p>
      </div>
    )

  return (
    <div className="grid gap-4">
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}
      {items.map((item) => {
        const now = Date.now()
        const patientCanCancel =
          role === 'PATIENT' && new Date(item.starts_at).getTime() >= now + 2 * 60 * 60 * 1000
        const doctorCanCancel = role === 'DOCTOR' && new Date(item.starts_at).getTime() > now
        const canClose = role === 'DOCTOR' && new Date(item.ends_at).getTime() <= now
        return (
          <article
            className="card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
            key={item.id}
          >
            <div>
              <span className="flex items-center gap-2 font-bold">
                {item.consultation_mode === 'VIRTUAL' ? <Laptop size={18} /> : <House size={18} />}{' '}
                {item.consultation_mode === 'VIRTUAL' ? 'Consulta virtual' : 'Atención a domicilio'}
              </span>
              <time className="mt-2 block text-slate-600">
                {new Intl.DateTimeFormat('es-PE', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                  timeZone: 'America/Lima',
                }).format(new Date(item.starts_at))}
              </time>
              {item.consultation_mode === 'HOME_VISIT' && (
                <p className="mt-2 text-sm text-slate-500">
                  {item.address} · {item.address_reference}
                </p>
              )}
              {item.consultation_mode === 'VIRTUAL' &&
                item.virtual_meeting_url &&
                item.status === 'CONFIRMED' && (
                  <a
                    className="mt-2 inline-block font-bold text-mint underline"
                    href={item.virtual_meeting_url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Entrar a la consulta
                  </a>
                )}
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-mint">
                {statusLabels[item.status]}
              </span>
              {item.status === 'CONFIRMED' && (patientCanCancel || doctorCanCancel) && (
                <button
                  className="btn-secondary flex-1 sm:flex-none"
                  disabled={busy === item.id}
                  onClick={() => cancel(item)}
                >
                  Cancelar
                </button>
              )}
              {item.status === 'CONFIRMED' && canClose && (
                <>
                  <button
                    className="btn-secondary flex-1 sm:flex-none"
                    disabled={busy === item.id}
                    onClick={() => void call(item.id, 'outcome', { status: 'COMPLETED' })}
                  >
                    Completar
                  </button>
                  <button
                    className="btn-secondary flex-1 sm:flex-none"
                    disabled={busy === item.id}
                    onClick={() => void call(item.id, 'outcome', { status: 'NO_SHOW' })}
                  >
                    No asistió
                  </button>
                </>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
