import type { Metadata } from 'next'
import { createClient } from '@insforge/sdk'
import { DoctorSearch } from '@/components/doctor-search'
import {
  demoDoctors,
  demoSpecialties,
  type DirectoryDoctor,
  type DirectorySpecialty,
} from '@/lib/demo-doctors'

export const metadata: Metadata = {
  title: 'Buscar médicos por especialidad',
  description: 'Elige una especialidad, compara profesionales y revisa su disponibilidad.',
}

type LiveDoctor = {
  user_id: string
  first_name: string | null
  last_name: string | null
  cmp: string | null
  bio: string | null
  avatar_url: string | null
  offers_virtual: boolean
  offers_home_visit: boolean
  doctor_specialties: { specialties: { id: string; name: string; slug: string } }[]
}

const specialtyCopy: Record<string, Pick<DirectorySpecialty, 'description' | 'prompt'>> = {
  'medicina-general': {
    description: 'Orientación inicial, prevención y seguimiento de la salud cotidiana.',
    prompt: 'Chequeos, síntomas frecuentes y acompañamiento integral.',
  },
  dermatologia: {
    description: 'Evaluación de la piel, cabello y uñas en cada etapa de vida.',
    prompt: 'Acné, manchas, dermatitis y cuidado preventivo.',
  },
  cardiologia: {
    description: 'Cuidado especializado del corazón y del sistema circulatorio.',
    prompt: 'Presión arterial, prevención y seguimiento cardiovascular.',
  },
  ginecologia: {
    description: 'Salud integral de la mujer con acompañamiento cercano y preventivo.',
    prompt: 'Controles, orientación y salud reproductiva.',
  },
  traumatologia: {
    description: 'Atención de lesiones y molestias del sistema musculoesquelético.',
    prompt: 'Dolor, movilidad, lesiones y recuperación funcional.',
  },
}

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ especialidad?: string | string[] }>
}) {
  const filters = await searchParams
  const requestedSpecialty = Array.isArray(filters.especialidad)
    ? filters.especialidad[0]
    : filters.especialidad

  const client = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
  })
  const [doctorsResult, specialtiesResult] = await Promise.all([
    client.database
      .from('doctor_profiles')
      .select(
        'user_id,first_name,last_name,cmp,bio,avatar_url,offers_virtual,offers_home_visit,doctor_specialties(specialties(id,name,slug))',
      )
      .eq('verification_status', 'VERIFIED')
      .limit(50),
    client.database.from('specialties').select('id,name,slug').eq('active', true).order('name'),
  ])

  const liveDoctors = ((doctorsResult.data ?? []) as unknown as LiveDoctor[]).map(
    (doctor): DirectoryDoctor => ({
      user_id: doctor.user_id,
      first_name: doctor.first_name ?? 'Profesional',
      last_name: doctor.last_name ?? '',
      display_title: 'Dr(a).',
      registration: doctor.cmp ? `CMP ${doctor.cmp}` : 'Colegiatura por completar',
      cmp: doctor.cmp ?? '',
      bio: doctor.bio ?? 'Conoce su perfil profesional y revisa sus horarios publicados.',
      avatar_url: doctor.avatar_url,
      offers_virtual: doctor.offers_virtual,
      offers_home_visit: doctor.offers_home_visit,
      verified: true,
      demo: false,
      years_experience: null,
      rating: null,
      review_count: 0,
      next_available_label: 'Revisa su agenda disponible',
      doctor_specialties: doctor.doctor_specialties ?? [],
    }),
  )

  const specialtyMap = new Map<string, DirectorySpecialty>()
  demoSpecialties.forEach((specialty) => specialtyMap.set(specialty.slug, specialty))
  ;(
    (specialtiesResult.data ?? []) as unknown as { id: string; name: string; slug: string }[]
  ).forEach((specialty) => {
    const demoCopy = specialtyMap.get(specialty.slug)
    const copy = specialtyCopy[specialty.slug]
    specialtyMap.set(specialty.slug, {
      id: specialty.id,
      name: specialty.name,
      slug: specialty.slug,
      description:
        demoCopy?.description ?? copy?.description ?? 'Encuentra profesionales para esta necesidad.',
      prompt: demoCopy?.prompt ?? copy?.prompt ?? 'Conoce perfiles y horarios disponibles.',
    })
  })

  return (
    <section className="container-page py-12 sm:py-16">
      <div className="max-w-4xl">
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-mint">
          Médicos verificados en Lima Metropolitana
        </span>
        <h1 className="mt-5 text-balance text-4xl font-black sm:text-5xl">
          Encuentra a tu médico empezando por la especialidad.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Primero cuéntanos qué atención necesitas. Después podrás comparar profesionales, conocer
          su experiencia, leer valoraciones y revisar sus horarios.
        </p>
      </div>

      <DoctorSearch
        doctors={[...demoDoctors, ...liveDoctors]}
        initialSpecialty={requestedSpecialty ?? ''}
        specialties={Array.from(specialtyMap.values())}
      />
    </section>
  )
}
