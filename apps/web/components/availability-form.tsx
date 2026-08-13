'use client'
import { useState } from 'react'
type Row = {
  weekday: number
  startTime: string
  endTime: string
  consultationMode: 'VIRTUAL' | 'HOME_VISIT'
}
const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export function AvailabilityForm() {
  const [items, setItems] = useState<Row[]>([
    { weekday: 1, startTime: '09:00', endTime: '12:00', consultationMode: 'VIRTUAL' },
  ])
  const [notice, setNotice] = useState('')
  function change(index: number, key: keyof Row, value: string | number) {
    setItems(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
  }
  async function save(e: React.FormEvent) {
    e.preventDefault()
    const token = document.cookie
      .split('; ')
      .find((i) => i.startsWith('insforge_access_token='))
      ?.split('=')[1]
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/doctors/me/availability`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${decodeURIComponent(token ?? '')}`,
      },
      body: JSON.stringify({ items }),
    })
    const data = (await response.json()) as { message?: string }
    setNotice(response.ok ? 'Disponibilidad actualizada.' : (data.message ?? 'No pudimos guardar.'))
  }
  return (
    <form onSubmit={save} className="card grid gap-4 p-6">
      {items.map((item, index) => (
        <div className="grid items-end gap-3 rounded-xl border p-4 md:grid-cols-4" key={index}>
          <div>
            <label className="label">Día</label>
            <select
              className="field"
              value={item.weekday}
              onChange={(e) => change(index, 'weekday', Number(e.target.value))}
            >
              {days.map((day, i) => (
                <option value={i + 1} key={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Inicio</label>
            <input
              className="field"
              type="time"
              step="1800"
              value={item.startTime}
              onChange={(e) => change(index, 'startTime', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Fin</label>
            <input
              className="field"
              type="time"
              step="1800"
              value={item.endTime}
              onChange={(e) => change(index, 'endTime', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Modalidad</label>
            <select
              className="field"
              value={item.consultationMode}
              onChange={(e) => change(index, 'consultationMode', e.target.value)}
            >
              <option value="VIRTUAL">Consulta virtual</option>
              <option value="HOME_VISIT">Atención a domicilio</option>
            </select>
          </div>
          <button
            className="text-sm font-bold text-red-700 md:col-span-4 md:justify-self-end"
            type="button"
            onClick={() => setItems(items.filter((_, i) => i !== index))}
          >
            Eliminar bloque
          </button>
        </div>
      ))}
      <button
        className="btn-secondary w-fit"
        type="button"
        onClick={() =>
          setItems([
            ...items,
            { weekday: 1, startTime: '09:00', endTime: '12:00', consultationMode: 'VIRTUAL' },
          ])
        }
      >
        Añadir bloque
      </button>
      {notice && (
        <p role="status" className="rounded-xl bg-cloud p-3">
          {notice}
        </p>
      )}
      <button className="btn-primary w-fit">Guardar disponibilidad</button>
    </form>
  )
}
