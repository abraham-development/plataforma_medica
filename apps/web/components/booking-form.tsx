'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { House, Laptop, LoaderCircle } from 'lucide-react'
import { insforge } from '@/lib/insforge/client'

type District = { id: string; name: string; province: string }
export function BookingForm({
  doctorId,
  offersVirtual,
  offersHomeVisit,
  districts,
}: {
  doctorId: string
  offersVirtual: boolean
  offersHomeVisit: boolean
  districts: District[]
}) {
  const router = useRouter()
  const initialMode = offersVirtual ? 'VIRTUAL' : 'HOME_VISIT'
  const [mode, setMode] = useState(initialMode)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const minimum = useMemo(() => {
    const date = new Date(Date.now() + 30 * 60_000)
    date.setMinutes(date.getMinutes() < 30 ? 30 : 60, 0, 0)
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
  }, [])
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setNotice('')
    const form = new FormData(event.currentTarget)
    const { data } = await insforge.auth.getCurrentUser()
    if (!data.user) {
      router.push('/login')
      return
    }
    const token = document.cookie
      .split('; ')
      .find((item) => item.startsWith('insforge_access_token='))
      ?.split('=')[1]
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${decodeURIComponent(token ?? '')}`,
      },
      body: JSON.stringify({
        doctorId,
        startsAt: new Date(String(form.get('startsAt'))).toISOString(),
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
    const result = (await response.json()) as { message?: string }
    setPending(false)
    if (!response.ok) {
      setNotice(result.message ?? 'No pudimos reservar ese horario.')
      return
    }
    setNotice('¡Cita confirmada! Ya aparece en tu panel.')
    setTimeout(() => router.push('/paciente/citas'), 900)
  }
  return (
    <form onSubmit={submit} className="card grid gap-5 p-6">
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
        <label className="label" htmlFor="startsAt">
          Fecha y hora
        </label>
        <input
          className="field"
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          min={minimum}
          step="1800"
          required
        />
      </div>
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
      <button className="btn-primary" disabled={pending}>
        {pending && <LoaderCircle className="animate-spin" size={18} />} Confirmar reserva
      </button>
    </form>
  )
}
