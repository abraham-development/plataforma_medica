'use client'
import { useEffect, useState } from 'react'
import { insforge } from '@/lib/insforge/client'
export function PatientProfileForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    void (async () => {
      const { data } = await insforge.database
        .from('patient_profiles')
        .select('first_name,last_name')
        .maybeSingle()
      const row = data as { first_name?: string; last_name?: string } | null
      setFirstName(row?.first_name ?? '')
      setLastName(row?.last_name ?? '')
    })()
  }, [])
  async function save(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await insforge.database
      .from('patient_profiles')
      .update({ first_name: firstName.trim(), last_name: lastName.trim() })
      .select()
    setNotice(error?.message ?? 'Perfil actualizado.')
  }
  return (
    <form onSubmit={save} className="card grid max-w-2xl gap-5 p-6">
      <div>
        <label className="label" htmlFor="firstName">
          Nombres completos
        </label>
        <input
          className="field"
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="lastName">
          Apellidos completos
        </label>
        <input
          className="field"
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>
      {notice && (
        <p role="status" className="rounded-xl bg-cloud p-3">
          {notice}
        </p>
      )}
      <button className="btn-primary w-fit">Guardar perfil</button>
    </form>
  )
}
