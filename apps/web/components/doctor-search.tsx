'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { House, Laptop, Search, ShieldCheck } from 'lucide-react'

type Doctor = {
  user_id: string
  first_name: string | null
  last_name: string | null
  cmp: string | null
  bio: string | null
  avatar_url: string | null
  offers_virtual: boolean
  offers_home_visit: boolean
}
export function DoctorSearch({ doctors }: { doctors: Doctor[] }) {
  const [term, setTerm] = useState('')
  const [mode, setMode] = useState('ALL')
  const visible = useMemo(
    () =>
      doctors.filter(
        (doctor) =>
          `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(term.toLowerCase()) &&
          (mode === 'ALL' ||
            (mode === 'VIRTUAL' ? doctor.offers_virtual : doctor.offers_home_visit)),
      ),
    [doctors, term, mode],
  )
  return (
    <>
      <div className="card mt-8 grid gap-4 p-4 md:grid-cols-[1fr_auto]">
        <label className="relative">
          <span className="sr-only">Buscar por nombre</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          <input
            className="field pl-10"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Buscar por nombre"
          />
        </label>
        <select
          className="field md:w-64"
          value={mode}
          onChange={(event) => setMode(event.target.value)}
          aria-label="Filtrar modalidad"
        >
          <option value="ALL">Todas las modalidades</option>
          <option value="VIRTUAL">Consulta virtual</option>
          <option value="HOME_VISIT">Atención a domicilio</option>
        </select>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {visible.map((doctor) => (
          <article className="card p-6" key={doctor.user_id}>
            <div className="flex gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cloud text-xl font-black text-ocean">
                {doctor.first_name?.[0] ?? 'M'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">
                    Dr(a). {doctor.first_name} {doctor.last_name}
                  </h2>
                  <ShieldCheck className="text-mint" size={18} />
                </div>
                <p className="text-sm text-slate-500">CMP {doctor.cmp}</p>
              </div>
            </div>
            <p className="mt-4 line-clamp-2 text-slate-600">{doctor.bio}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
              {doctor.offers_virtual && (
                <span className="flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-ocean">
                  <Laptop size={15} /> Virtual
                </span>
              )}
              {doctor.offers_home_visit && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-mint">
                  <House size={15} /> A domicilio
                </span>
              )}
            </div>
            <Link className="btn-primary mt-5 w-full" href={`/medicos/${doctor.user_id}`}>
              Ver perfil y horarios
            </Link>
          </article>
        ))}
        {!visible.length && (
          <div className="card col-span-full p-10 text-center text-slate-600">
            No encontramos médicos con esos filtros.
          </div>
        )}
      </div>
    </>
  )
}
