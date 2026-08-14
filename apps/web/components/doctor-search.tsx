'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Baby,
  Brain,
  CalendarDays,
  ChevronRight,
  HeartPulse,
  House,
  Laptop,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
} from 'lucide-react'
import type { DirectoryDoctor, DirectorySpecialty } from '@/lib/demo-doctors'

const specialtyIcons = {
  pediatria: Baby,
  psicologia: Brain,
  cardiologia: HeartPulse,
}

function SpecialtyIcon({ slug }: { slug: string }) {
  const Icon = specialtyIcons[slug as keyof typeof specialtyIcons] ?? Stethoscope
  return <Icon size={26} />
}

function DoctorAvatar({ doctor }: { doctor: DirectoryDoctor }) {
  if (!doctor.avatar_url) {
    return (
      <div className="grid h-full min-h-52 w-full place-items-center bg-gradient-to-br from-sky-50 to-emerald-50 text-5xl font-black text-ocean">
        {doctor.first_name?.[0] ?? 'M'}
      </div>
    )
  }

  if (doctor.avatar_url.startsWith('/')) {
    return (
      <Image
        alt={`${doctor.display_title} ${doctor.first_name} ${doctor.last_name}`}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        src={doctor.avatar_url}
      />
    )
  }

  return (
    // Las fotos reales pueden venir de InsForge Storage con un dominio configurable.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={`${doctor.display_title} ${doctor.first_name} ${doctor.last_name}`}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      src={doctor.avatar_url}
    />
  )
}

export function DoctorSearch({
  doctors,
  specialties,
  initialSpecialty = '',
}: {
  doctors: DirectoryDoctor[]
  specialties: DirectorySpecialty[]
  initialSpecialty?: string
}) {
  const [selectedSpecialty, setSelectedSpecialty] = useState(
    specialties.some((item) => item.slug === initialSpecialty) ? initialSpecialty : '',
  )
  const [specialtyTerm, setSpecialtyTerm] = useState('')
  const [doctorTerm, setDoctorTerm] = useState('')
  const [mode, setMode] = useState('ALL')

  const specialtyCounts = useMemo(() => {
    const counts = new Map<string, number>()
    doctors.forEach((doctor) =>
      doctor.doctor_specialties.forEach(({ specialties: specialty }) =>
        counts.set(specialty.slug, (counts.get(specialty.slug) ?? 0) + 1),
      ),
    )
    return counts
  }, [doctors])

  const visibleSpecialties = useMemo(
    () =>
      specialties.filter((specialty) => {
        const term = specialtyTerm.trim().toLowerCase()
        return (
          !term ||
          specialty.name.toLowerCase().includes(term) ||
          specialty.description.toLowerCase().includes(term) ||
          specialty.prompt.toLowerCase().includes(term)
        )
      }),
    [specialties, specialtyTerm],
  )

  const activeSpecialty = specialties.find((item) => item.slug === selectedSpecialty)
  const visibleDoctors = useMemo(
    () =>
      doctors.filter((doctor) => {
        const matchesSpecialty = doctor.doctor_specialties.some(
          ({ specialties: specialty }) => specialty.slug === selectedSpecialty,
        )
        const fullName = `${doctor.first_name} ${doctor.last_name}`.toLowerCase()
        const matchesName = fullName.includes(doctorTerm.trim().toLowerCase())
        const matchesMode =
          mode === 'ALL' ||
          (mode === 'VIRTUAL' ? doctor.offers_virtual : doctor.offers_home_visit)
        return matchesSpecialty && matchesName && matchesMode
      }),
    [doctors, doctorTerm, mode, selectedSpecialty],
  )

  function chooseSpecialty(slug: string) {
    setSelectedSpecialty(slug)
    setDoctorTerm('')
    setMode('ALL')
    window.history.pushState(null, '', `/medicos?especialidad=${encodeURIComponent(slug)}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function clearSpecialty() {
    setSelectedSpecialty('')
    setDoctorTerm('')
    setMode('ALL')
    window.history.pushState(null, '', '/medicos')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mt-9">
      <div className="mb-8 flex items-center gap-3 text-sm font-bold" aria-label="Progreso de búsqueda">
        <span
          className={`grid h-8 w-8 place-items-center rounded-full ${
            selectedSpecialty ? 'bg-emerald-100 text-mint' : 'bg-mint text-white'
          }`}
        >
          1
        </span>
        <span className={selectedSpecialty ? 'text-slate-500' : 'text-ink'}>Especialidad</span>
        <span className="h-px w-8 bg-slate-200 sm:w-16" />
        <span
          className={`grid h-8 w-8 place-items-center rounded-full ${
            selectedSpecialty ? 'bg-mint text-white' : 'bg-slate-100 text-slate-400'
          }`}
        >
          2
        </span>
        <span className={selectedSpecialty ? 'text-ink' : 'text-slate-400'}>Profesional</span>
      </div>

      {!selectedSpecialty ? (
        <>
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[.16em] text-mint">
              Paso 1 de 2
            </p>
            <h2 className="mt-3 text-balance text-3xl font-black sm:text-4xl">
              ¿Qué tipo de atención necesitas?
            </h2>
            <p className="mt-3 leading-7 text-slate-600">
              Elige una especialidad para ver únicamente profesionales que pueden ayudarte con esa
              necesidad.
            </p>
          </div>

          <label className="relative mt-7 block max-w-2xl">
            <span className="sr-only">Buscar especialidad</span>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              autoComplete="off"
              className="field min-h-14 pl-12 text-base shadow-sm"
              value={specialtyTerm}
              onChange={(event) => setSpecialtyTerm(event.target.value)}
              placeholder="Busca pediatría, psicología…"
            />
          </label>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {visibleSpecialties.map((specialty) => {
              const count = specialtyCounts.get(specialty.slug) ?? 0
              return (
                <button
                  className="group card relative overflow-hidden p-6 text-left transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!count}
                  key={specialty.id}
                  onClick={() => chooseSpecialty(specialty.slug)}
                  type="button"
                >
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-50 transition group-hover:scale-125" />
                  <div className="relative flex items-start justify-between gap-5">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-mint">
                      <SpecialtyIcon slug={specialty.slug} />
                    </span>
                    <span className="rounded-full bg-cloud px-3 py-1 text-xs font-black text-slate-600">
                      {count ? `${count} especialistas` : 'Próximamente'}
                    </span>
                  </div>
                  <h3 className="relative mt-6 text-2xl font-black">{specialty.name}</h3>
                  <p className="relative mt-2 leading-7 text-slate-600">{specialty.description}</p>
                  <p className="relative mt-4 text-sm text-slate-500">{specialty.prompt}</p>
                  <span className="relative mt-6 inline-flex items-center gap-2 font-black text-ocean">
                    Ver médicos <ChevronRight className="transition group-hover:translate-x-1" size={18} />
                  </span>
                </button>
              )
            })}
          </div>

          {!visibleSpecialties.length && (
            <div className="card mt-8 p-10 text-center text-slate-600">
              No encontramos una especialidad con ese nombre.
            </div>
          )}
        </>
      ) : (
        <>
          <button
            className="inline-flex items-center gap-2 text-sm font-black text-ocean hover:text-mint"
            onClick={clearSpecialty}
            type="button"
          >
            <ArrowLeft size={17} /> Cambiar especialidad
          </button>

          <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[.16em] text-mint">
                {activeSpecialty?.name}
              </p>
              <h2 className="mt-2 text-balance text-3xl font-black sm:text-4xl">
                Elige al profesional que mejor conecte contigo
              </h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                Compara experiencia, valoraciones, modalidades y próximos horarios antes de abrir
                cada perfil.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-mint">
              {visibleDoctors.length} resultados
            </span>
          </div>

          <div className="card mt-7 grid gap-4 p-4 md:grid-cols-[1fr_auto]">
            <label className="relative">
              <span className="sr-only">Buscar médico por nombre</span>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
              <input
                className="field pl-11"
                value={doctorTerm}
                onChange={(event) => setDoctorTerm(event.target.value)}
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

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleDoctors.map((doctor) => (
              <article
                className="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-soft"
                key={doctor.user_id}
              >
                <div className="relative h-56 overflow-hidden bg-cloud">
                  <DoctorAvatar doctor={doctor} />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {doctor.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-mint shadow-sm">
                        <ShieldCheck size={15} /> Verificado
                      </span>
                    )}
                    {doctor.demo && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-black text-white">
                        <Sparkles size={14} /> Perfil de muestra
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-sm font-black text-mint">
                    {doctor.doctor_specialties.map((item) => item.specialties.name).join(' · ')}
                  </p>
                  <h3 className="mt-1 text-2xl font-black">
                    {doctor.display_title} {doctor.first_name} {doctor.last_name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{doctor.registration}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    {doctor.rating !== null && (
                      <span className="flex items-center gap-1 font-black text-ink">
                        <Star className="fill-amber-400 text-amber-400" size={17} />
                        {doctor.rating.toFixed(1)}
                        <span className="font-medium text-slate-500">({doctor.review_count})</span>
                      </span>
                    )}
                    {doctor.years_experience !== null && (
                      <span className="font-semibold text-slate-600">
                        {doctor.years_experience} años de experiencia
                      </span>
                    )}
                  </div>

                  <p className="mt-4 line-clamp-3 min-h-[4.5rem] leading-6 text-slate-600">
                    {doctor.bio}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                    {doctor.offers_virtual && (
                      <span className="flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1.5 text-ocean">
                        <Laptop size={14} /> Virtual
                      </span>
                    )}
                    {doctor.offers_home_visit && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-mint">
                        <House size={14} /> A domicilio
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-xl bg-cloud px-3 py-2.5 text-sm font-bold text-slate-700">
                    <CalendarDays className="text-mint" size={17} /> {doctor.next_available_label}
                  </div>

                  <Link className="btn-primary mt-5 w-full" href={`/medicos/${doctor.user_id}`}>
                    Conocer perfil y disponibilidad
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {!visibleDoctors.length && (
            <div className="card mt-8 p-10 text-center text-slate-600">
              No encontramos profesionales con esos filtros. Prueba otra modalidad o nombre.
            </div>
          )}
        </>
      )}
    </div>
  )
}
