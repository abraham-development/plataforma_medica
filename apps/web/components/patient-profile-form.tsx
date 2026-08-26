'use client'
import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { authenticatedApiFetch, handleSessionError } from '@/lib/insforge/authenticated-fetch'

export function PatientProfileForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const response = await authenticatedApiFetch('/patients/me')
        if (!response.ok) throw new Error('No pudimos cargar tu perfil.')
        const row = (await response.json()) as {
          first_name?: string | null
          last_name?: string | null
        }
        setFirstName(row.first_name ?? '')
        setLastName(row.last_name ?? '')
      } catch (error) {
        if (!handleSessionError(error)) {
          setNotice(error instanceof Error ? error.message : 'No pudimos cargar tu perfil.')
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setNotice('')
    try {
      const response = await authenticatedApiFetch('/patients/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      })
      const result = (await response.json()) as { message?: string | string[] }
      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(', ')
            : (result.message ?? 'No pudimos guardar tu perfil.'),
        )
      }
      setNotice('Perfil actualizado.')
      window.dispatchEvent(new Event('medicerca:profile-changed'))
    } catch (error) {
      if (!handleSessionError(error)) {
        setNotice(error instanceof Error ? error.message : 'No pudimos guardar tu perfil.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="card grid max-w-2xl gap-5 p-6">
      {loading && (
        <p className="flex items-center gap-2 rounded-xl bg-cloud p-4 text-sm text-slate-600">
          <LoaderCircle className="animate-spin" size={18} /> Cargando tu perfil…
        </p>
      )}
      <div>
        <label className="label" htmlFor="firstName">
          Nombres completos
        </label>
        <input
          className="field"
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={loading || saving}
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
          disabled={loading || saving}
          required
        />
      </div>
      {notice && (
        <p role="status" className="rounded-xl bg-cloud p-3">
          {notice}
        </p>
      )}
      <button className="btn-primary w-fit" disabled={loading || saving}>
        {saving && <LoaderCircle className="animate-spin" size={18} />}
        {saving ? 'Guardando…' : 'Guardar perfil'}
      </button>
    </form>
  )
}
