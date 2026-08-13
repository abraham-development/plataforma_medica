'use client'
import { useEffect, useState } from 'react'
import { insforge } from '@/lib/insforge/client'
type Doctor = {
  user_id: string
  first_name: string | null
  last_name: string | null
  cmp: string | null
  verification_status: string
}
type Metrics = {
  pendingDoctors: number
  verifiedDoctors: number
  suspendedDoctors: number
  patients: number
  todayAppointments: number
  futureAppointments: number
  cancelledAppointments: number
}
export function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [notice, setNotice] = useState('')
  async function load() {
    const [m, d] = await Promise.all([
      insforge.database.rpc('admin_dashboard'),
      insforge.database
        .from('doctor_profiles')
        .select('user_id,first_name,last_name,cmp,verification_status')
        .order('created_at', { ascending: false })
        .limit(100),
    ])
    setMetrics(m.data as Metrics)
    setDoctors((d.data ?? []) as Doctor[])
  }
  useEffect(() => {
    void load()
  }, [])
  async function status(id: string, value: string) {
    const reason = value === 'VERIFIED' ? null : window.prompt('Motivo de la decisión:')
    if (value !== 'VERIFIED' && !reason) return
    const { error } = await insforge.database.rpc('admin_set_doctor_status', {
      target_doctor: id,
      target_status: value,
      reason,
    })
    setNotice(error?.message ?? 'Estado actualizado y auditado.')
    await load()
  }
  return (
    <div className="grid gap-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics &&
          Object.entries(metrics).map(([key, value]) => (
            <article className="card p-5" key={key}>
              <p className="text-sm text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</p>
              <strong className="mt-2 block text-3xl">{value}</strong>
            </article>
          ))}
      </div>
      <section className="card overflow-hidden">
        <div className="border-b p-5">
          <h2 className="text-xl font-bold">Verificación de médicos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-cloud text-sm">
              <tr>
                <th className="p-4">Médico</th>
                <th className="p-4">CMP</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr className="border-t" key={d.user_id}>
                  <td className="p-4">
                    {d.first_name} {d.last_name}
                  </td>
                  <td className="p-4">{d.cmp ?? 'Pendiente'}</td>
                  <td className="p-4 font-bold">{d.verification_status}</td>
                  <td className="flex flex-wrap gap-2 p-4">
                    <button
                      className="btn-primary !px-3 !py-2 text-sm"
                      onClick={() => status(d.user_id, 'VERIFIED')}
                    >
                      Verificar
                    </button>
                    <button
                      className="btn-secondary !px-3 !py-2 text-sm"
                      onClick={() => status(d.user_id, 'REJECTED')}
                    >
                      Rechazar
                    </button>
                    <button
                      className="text-sm font-bold text-red-700"
                      onClick={() => status(d.user_id, 'SUSPENDED')}
                    >
                      Suspender
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {notice && (
        <p role="status" className="rounded-xl bg-cloud p-3">
          {notice}
        </p>
      )}
    </div>
  )
}
