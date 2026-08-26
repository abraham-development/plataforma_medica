import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@insforge/sdk'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Award,
  CalendarDays,
  GraduationCap,
  House,
  Languages,
  Laptop,
  MapPin,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import { BookingForm } from '@/components/booking-form'
import { DemoBookingPanel } from '@/components/demo-booking-panel'
import { getDemoAvailableSlots, getDemoDoctor, type PatientReview } from '@/lib/demo-doctors'

function limaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function addDays(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12)
  date.setDate(date.getDate() + amount)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

type District = { id: string; name: string; province: string }
type AvailableSlot = {
  startsAt: string
  consultationMode: 'VIRTUAL' | 'HOME_VISIT'
}
type ProfileView = {
  user_id: string
  first_name: string
  last_name: string
  display_title: string
  registration: string
  headline: string
  bio: string
  avatar_url: string | null
  offers_virtual: boolean
  offers_home_visit: boolean
  doctor_specialties: { specialties: { name: string } }[]
  districts: District[]
  demo: boolean
  years_experience: number | null
  rating: number | null
  review_count: number
  education: string[]
  languages: string[]
  focus_areas: string[]
  reviews: PatientReview[]
}

function ProfileAvatar({ profile }: { profile: ProfileView }) {
  const name = `${profile.display_title} ${profile.first_name} ${profile.last_name}`
  if (!profile.avatar_url) {
    return (
      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-sky-50 to-emerald-50 text-6xl font-black text-ocean">
        {profile.first_name?.[0]}
      </div>
    )
  }
  if (profile.avatar_url.startsWith('/')) {
    return (
      <Image
        alt={name}
        className="h-full w-full object-cover"
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 420px"
        src={profile.avatar_url}
      />
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={name} className="h-full w-full object-cover" src={profile.avatar_url} />
  )
}

export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const demoDoctor = getDemoDoctor(id)
  const rangeStart = limaDateKey()

  let profile: ProfileView
  let availableSlots: AvailableSlot[]

  if (demoDoctor) {
    profile = {
      ...demoDoctor,
      doctor_specialties: demoDoctor.doctor_specialties,
      districts: demoDoctor.districts.map((name, index) => ({
        id: `demo-district-${index}`,
        name,
        province: 'LIMA',
      })),
    }
    availableSlots = getDemoAvailableSlots(demoDoctor, rangeStart)
  } else {
    const client = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    })
    const { data: doctor } = await client.database
      .from('doctor_profiles')
      .select(
        'user_id,first_name,last_name,cmp,bio,avatar_url,offers_virtual,offers_home_visit,doctor_specialties(specialties(id,name,slug)),doctor_service_districts(districts(id,name,province))',
      )
      .eq('user_id', id)
      .eq('verification_status', 'VERIFIED')
      .maybeSingle()
    if (!doctor) notFound()
    const liveDoctor = doctor as unknown as {
      user_id: string
      first_name: string
      last_name: string
      cmp: string
      bio: string
      avatar_url: string | null
      offers_virtual: boolean
      offers_home_visit: boolean
      doctor_specialties: { specialties: { name: string } }[]
      doctor_service_districts: { districts: District }[]
    }
    const districts = liveDoctor.doctor_service_districts.map((item) => item.districts)
    profile = {
      user_id: liveDoctor.user_id,
      first_name: liveDoctor.first_name,
      last_name: liveDoctor.last_name,
      display_title: 'Dr(a).',
      registration: `CMP ${liveDoctor.cmp}`,
      headline: 'Profesional verificado con agenda publicada en MediCerca.',
      bio: liveDoctor.bio,
      avatar_url: liveDoctor.avatar_url,
      offers_virtual: liveDoctor.offers_virtual,
      offers_home_visit: liveDoctor.offers_home_visit,
      doctor_specialties: liveDoctor.doctor_specialties,
      districts,
      demo: false,
      years_experience: null,
      rating: null,
      review_count: 0,
      education: [],
      languages: ['Español'],
      focus_areas: [],
      reviews: [],
    }

    const rangeEnd = addDays(rangeStart, 60)
    const [virtualSlotsResult, homeVisitSlotsResult] = await Promise.all([
      profile.offers_virtual
        ? client.database.rpc('get_doctor_available_slots', {
            requested_doctor: id,
            range_start: rangeStart,
            range_end: rangeEnd,
            requested_mode: 'VIRTUAL',
          })
        : Promise.resolve({ data: [], error: null }),
      profile.offers_home_visit
        ? client.database.rpc('get_doctor_available_slots', {
            requested_doctor: id,
            range_start: rangeStart,
            range_end: rangeEnd,
            requested_mode: 'HOME_VISIT',
          })
        : Promise.resolve({ data: [], error: null }),
    ])
    availableSlots = [
      ...((virtualSlotsResult.data ?? []) as { starts_at: string }[]).map((slot) => ({
        startsAt: slot.starts_at,
        consultationMode: 'VIRTUAL' as const,
      })),
      ...((homeVisitSlotsResult.data ?? []) as { starts_at: string }[]).map((slot) => ({
        startsAt: slot.starts_at,
        consultationMode: 'HOME_VISIT' as const,
      })),
    ]
  }

  const fullName = `${profile.display_title} ${profile.first_name} ${profile.last_name}`

  return (
    <section className="container-page py-10 sm:py-14">
      <Link
        className="inline-flex items-center gap-2 text-sm font-black text-ocean"
        href="/medicos"
      >
        <ArrowLeft size={17} /> Volver a buscar médicos
      </Link>

      {profile.demo && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <Sparkles className="mt-0.5 shrink-0" size={19} />
          <p>
            <strong>Perfil demostrativo:</strong> los datos, horarios y opiniones de esta página son
            ficticios y muestran cómo funcionará la experiencia con profesionales reales.
          </p>
        </div>
      )}

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-7">
          <article className="card overflow-hidden">
            <div className="grid md:grid-cols-[280px_1fr]">
              <div className="relative min-h-80 bg-cloud md:min-h-[370px]">
                <ProfileAvatar profile={profile} />
              </div>
              <div className="p-7 sm:p-9">
                <div className="flex flex-wrap gap-2">
                  {profile.doctor_specialties.map((item) => (
                    <span
                      className="rounded-full bg-sky-50 px-3 py-1 text-sm font-black text-ocean"
                      key={item.specialties.name}
                    >
                      {item.specialties.name}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-start gap-2">
                  <h1 className="text-balance text-3xl font-black sm:text-4xl">{fullName}</h1>
                  <ShieldCheck className="mt-1 shrink-0 text-mint" aria-label="Perfil verificado" />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-500">{profile.registration}</p>
                <p className="mt-5 text-lg leading-8 text-slate-700">{profile.headline}</p>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-cloud p-4">
                    <ShieldCheck className="text-mint" size={20} />
                    <p className="mt-2 font-black">Verificado</p>
                    <p className="text-xs text-slate-500">Identidad y perfil</p>
                  </div>
                  <div className="rounded-2xl bg-cloud p-4">
                    <Award className="text-ocean" size={20} />
                    <p className="mt-2 font-black">
                      {profile.years_experience
                        ? `${profile.years_experience} años`
                        : 'Profesional'}
                    </p>
                    <p className="text-xs text-slate-500">Experiencia</p>
                  </div>
                  <div className="rounded-2xl bg-cloud p-4">
                    <Star className="fill-amber-400 text-amber-400" size={20} />
                    <p className="mt-2 font-black">
                      {profile.rating ? `${profile.rating.toFixed(1)} / 5` : 'Sin reseñas aún'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {profile.review_count
                        ? `${profile.review_count} valoraciones`
                        : 'Nuevo perfil'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="card p-7 sm:p-9">
            <h2 className="text-2xl font-black">Sobre el profesional</h2>
            <p className="mt-4 whitespace-pre-line leading-8 text-slate-600">{profile.bio}</p>

            {profile.focus_areas.length > 0 && (
              <>
                <h3 className="mt-8 font-black">Áreas en las que puede ayudarte</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.focus_areas.map((area) => (
                    <span
                      className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-bold text-mint"
                      key={area}
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </>
            )}

            <div className="mt-9 grid gap-7 sm:grid-cols-2">
              {profile.education.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-black">
                    <GraduationCap className="text-ocean" size={21} /> Formación
                  </h3>
                  <ul className="mt-3 grid gap-3 text-sm leading-6 text-slate-600">
                    {profile.education.map((item) => (
                      <li className="border-l-2 border-sky-100 pl-3" key={item}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h3 className="flex items-center gap-2 font-black">
                  <Languages className="text-mint" size={21} /> Idiomas
                </h3>
                <p className="mt-3 text-sm text-slate-600">{profile.languages.join(', ')}</p>
              </div>
            </div>
          </article>

          <article className="card p-7 sm:p-9">
            <h2 className="text-2xl font-black">Cómo puede atenderte</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {profile.offers_virtual && (
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5 text-ocean">
                  <Laptop size={24} />
                  <h3 className="mt-4 font-black">Consulta virtual</h3>
                  <p className="mt-1 text-sm text-slate-600">Atención desde donde estés.</p>
                </div>
              )}
              {profile.offers_home_visit && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-mint">
                  <House size={24} />
                  <h3 className="mt-4 font-black">Atención a domicilio</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    El profesional se acerca a tu hogar.
                  </p>
                </div>
              )}
            </div>

            {profile.districts.length > 0 && (
              <div className="mt-6 rounded-2xl bg-cloud p-5">
                <h3 className="flex items-center gap-2 font-black">
                  <MapPin className="text-mint" size={20} /> Distritos con cobertura
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {profile.districts.map((district) => district.name).join(', ')}
                </p>
              </div>
            )}
          </article>

          {profile.reviews.length > 0 && (
            <article className="card p-7 sm:p-9">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.16em] text-mint">
                    Opiniones de ejemplo
                  </p>
                  <h2 className="mt-2 text-2xl font-black">Lo que valoran sus pacientes</h2>
                </div>
                <span className="text-sm font-bold text-slate-500">Contenido demostrativo</span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {profile.reviews.map((review) => (
                  <blockquote
                    className="rounded-2xl border border-slate-100 bg-cloud p-5"
                    key={`${review.author}-${review.dateLabel}`}
                  >
                    <MessageSquareQuote className="text-mint" size={22} />
                    <div
                      className="mt-3 flex gap-0.5"
                      aria-label={`${review.rating} de 5 estrellas`}
                    >
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          className={
                            index < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }
                          key={index}
                          size={15}
                        />
                      ))}
                    </div>
                    <p className="mt-3 leading-7 text-slate-600">“{review.text}”</p>
                    <footer className="mt-4 text-sm">
                      <strong>{review.author}</strong>
                      <span className="text-slate-500"> · {review.dateLabel}</span>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </article>
          )}

          <div className="flex items-center gap-3 rounded-2xl bg-ink p-5 text-white">
            <CalendarDays className="shrink-0 text-emerald-300" size={24} />
            <p className="text-sm leading-6 text-slate-200">
              Los horarios que ves son publicados por cada profesional y se actualizan cuando una
              cita es reservada.
            </p>
          </div>
        </div>

        {profile.demo ? (
          <DemoBookingPanel
            availableSlots={availableSlots}
            doctorName={fullName}
            offersHomeVisit={profile.offers_home_visit}
            offersVirtual={profile.offers_virtual}
          />
        ) : (
          <aside>
            <BookingForm
              availableSlots={availableSlots}
              districts={profile.districts}
              doctorId={id}
              offersHomeVisit={profile.offers_home_visit}
              offersVirtual={profile.offers_virtual}
            />
          </aside>
        )}
      </div>
    </section>
  )
}
