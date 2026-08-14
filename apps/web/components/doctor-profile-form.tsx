'use client'
import { useEffect, useState } from 'react'
import { insforge } from '@/lib/insforge/client'
type Catalog = { id: string; name: string }
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
  useEffect(() => {
    void (async () => {
      const [s, d] = await Promise.all([
        insforge.database.from('specialties').select('id,name').eq('active', true).order('name'),
        insforge.database.from('districts').select('id,name').eq('active', true).order('name'),
      ])
      setSpecialties((s.data ?? []) as Catalog[])
      setDistricts((d.data ?? []) as Catalog[])
    })()
  }, [])
  async function save(e: React.FormEvent) {
    e.preventDefault()
    const token = document.cookie
      .split('; ')
      .find((i) => i.startsWith('insforge_access_token='))
      ?.split('=')[1]
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/doctors/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${decodeURIComponent(token ?? '')}`,
      },
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
    const data = (await response.json()) as { message?: string }
    setNotice(
      response.ok ? 'Perfil enviado para verificación.' : (data.message ?? 'No pudimos guardar.'),
    )
  }
  function toggle(value: string, list: string[], setter: (values: string[]) => void) {
    setter(list.includes(value) ? list.filter((i) => i !== value) : [...list, value])
  }
  return (
    <form onSubmit={save} className="card grid gap-5 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nombres completos</label>
          <input
            className="field"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Apellidos completos</label>
          <input
            className="field"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
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
            />{' '}
            Consulta virtual
          </label>
          <label>
            <input type="checkbox" checked={home} onChange={(e) => setHome(e.target.checked)} />{' '}
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
      <button className="btn-primary w-full sm:w-fit">Guardar y enviar a revisión</button>
    </form>
  )
}
