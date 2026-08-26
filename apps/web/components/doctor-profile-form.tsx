'use client'
import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { insforge } from '@/lib/insforge/client'
import { authenticatedApiFetch, handleSessionError } from '@/lib/insforge/authenticated-fetch'

type Catalog = { id: string; name: string }
type DoctorProfile = {
  first_name?: string | null
  last_name?: string | null
  cmp?: string | null
  bio?: string | null
  offers_virtual?: boolean
  offers_home_visit?: boolean
  virtual_meeting_url?: string | null
  doctor_specialties?: { specialty_id: string }[]
  doctor_service_districts?: { district_id: string }[]
}

export function DoctorProfileForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [cmp, setCmp] = useState('')
  const [bio, setBio] = useState('')
  const [virtual, setVirtual] = useState(true)
  const [home, setHome] = useState(false)
  const [url, setUrl] = useState('')
  const [specialties, setSpecialties] = useState<Catalog[]>([])
  const [districts, setDistricts] = useState<Catalog[]>([])
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const [specialtiesResult, districtsResult, profileResponse] = await Promise.all([
          insforge.database.from('specialties').select('id,name').eq('active', true).order('name'),
          insforge.database.from('districts').select('id,name').eq('active', true).order('name'),
          authenticatedApiFetch('/me/doctor-profile'),
        ])
        if (specialtiesResult.error || districtsResult.error || !profileResponse.ok) {
          throw new Error('No pudimos cargar tu perfil profesional.')
        }

        const profile = (await profileResponse.json()) as DoctorProfile
        setSpecialties((specialtiesResult.data ?? []) as Catalog[])
        setDistricts((districtsResult.data ?? []) as Catalog[])
        setFirstName(profile.first_name ?? '')
        setLastName(profile.last_name ?? '')
        setCmp(profile.cmp ?? '')
        setBio(profile.bio ?? '')
        setVirtual(Boolean(profile.offers_virtual))
        setHome(Boolean(profile.offers_home_visit))
        setUrl(profile.virtual_meeting_url ?? '')
        setSelectedSpecialties((profile.doctor_specialties ?? []).map((item) => item.specialty_id))
        setSelectedDistricts(
          (profile.doctor_service_districts ?? []).map((item) => item.district_id),
        )
      } catch (error) {
        if (!handleSessionError(error)) {
          setNotice(
            error instanceof Error ? error.message : 'No pudimos cargar tu perfil profesional.',
          )
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
      const response = await authenticatedApiFetch('/doctors/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          cmp,
          bio,
          offersVirtual: virtual,
          offersHomeVisit: home,
          virtualMeetingUrl: virtual ? url : undefined,
          specialtyIds: selectedSpecialties,
          districtIds: home ? selectedDistricts : [],
        }),
      })
      const data = (await response.json()) as { message?: string | string[] }
      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : (data.message ?? 'No pudimos guardar.'),
        )
      }
      setNotice('Perfil enviado para verificación.')
      window.dispatchEvent(new Event('medicerca:profile-changed'))
    } catch (error) {
      if (!handleSessionError(error)) {
        setNotice(error instanceof Error ? error.message : 'No pudimos guardar.')
      }
    } finally {
      setSaving(false)
    }
  }
  function toggle(value: string, list: string[], setter: (values: string[]) => void) {
    setter(list.includes(value) ? list.filter((i) => i !== value) : [...list, value])
  }
  return (
    <form onSubmit={save} className="card grid gap-5 p-4 sm:p-6">
      {loading && (
        <p className="flex items-center gap-2 rounded-xl bg-cloud p-4 text-sm text-slate-600">
          <LoaderCircle className="animate-spin" size={18} /> Cargando tu perfil profesional…
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nombres completos</label>
          <input
            className="field"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading || saving}
            required
          />
        </div>
        <div>
          <label className="label">Apellidos completos</label>
          <input
            className="field"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading || saving}
            required
          />
        </div>
      </div>
      <div>
        <label className="label">Número CMP</label>
        <input
          className="field"
          value={cmp}
          onChange={(e) => setCmp(e.target.value)}
          disabled={loading || saving}
          required
          maxLength={20}
        />
      </div>
      <div>
        <label className="label">Biografía profesional</label>
        <textarea
          className="field"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          disabled={loading || saving}
          required
          maxLength={1200}
          rows={5}
        />
      </div>
      <fieldset>
        <legend className="label">Modalidades ofrecidas</legend>
        <div className="flex flex-wrap gap-4">
          <label>
            <input
              type="checkbox"
              checked={virtual}
              onChange={(e) => setVirtual(e.target.checked)}
              disabled={loading || saving}
            />{' '}
            Consulta virtual
          </label>
          <label>
            <input
              type="checkbox"
              checked={home}
              disabled={loading || saving}
              onChange={(e) => setHome(e.target.checked)}
            />{' '}
            Atención a domicilio
          </label>
        </div>
      </fieldset>
      {virtual && (
        <div>
          <label className="label">Enlace HTTPS de consulta virtual</label>
          <input
            className="field"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading || saving}
            placeholder="https://meet..."
          />
        </div>
      )}
      <fieldset>
        <legend className="label">Especialidades</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {specialties.map((i) => (
            <label key={i.id} className="rounded-lg border p-3">
              <input
                type="checkbox"
                checked={selectedSpecialties.includes(i.id)}
                disabled={loading || saving}
                onChange={() => toggle(i.id, selectedSpecialties, setSelectedSpecialties)}
              />{' '}
              {i.name}
            </label>
          ))}
        </div>
      </fieldset>
      {home && (
        <fieldset>
          <legend className="label">Distritos atendidos a domicilio</legend>
          <div className="grid max-h-64 gap-2 overflow-auto rounded-xl border p-3 sm:grid-cols-2">
            {districts.map((i) => (
              <label key={i.id}>
                <input
                  type="checkbox"
                  checked={selectedDistricts.includes(i.id)}
                  disabled={loading || saving}
                  onChange={() => toggle(i.id, selectedDistricts, setSelectedDistricts)}
                />{' '}
                {i.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {notice && (
        <p role="status" className="rounded-xl bg-cloud p-3">
          {notice}
        </p>
      )}
      <button className="btn-primary w-full sm:w-fit" disabled={loading || saving}>
        {saving && <LoaderCircle className="animate-spin" size={18} />}
        {saving ? 'Guardando…' : 'Guardar y enviar a revisión'}
      </button>
    </form>
  )
}
