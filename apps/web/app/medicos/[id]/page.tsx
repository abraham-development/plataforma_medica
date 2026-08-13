import { createClient } from '@insforge/sdk'
import { notFound } from 'next/navigation'
import { House, Laptop, ShieldCheck } from 'lucide-react'
import { BookingForm } from '@/components/booking-form'
export const dynamic = 'force-dynamic'
export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
  const profile = doctor as unknown as {
    user_id: string
    first_name: string
    last_name: string
    cmp: string
    bio: string
    offers_virtual: boolean
    offers_home_visit: boolean
    doctor_specialties: { specialties: { name: string } }[]
    doctor_service_districts: { districts: { id: string; name: string; province: string } }[]
  }
  const districts = profile.doctor_service_districts.map((item) => item.districts)
  return (
    <section className="container-page py-14">
      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <article>
          <div className="card p-7">
            <div className="flex items-start gap-5">
              <div className="grid h-24 w-24 place-items-center rounded-3xl bg-cloud text-3xl font-black text-ocean">
                {profile.first_name?.[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-black">
                    Dr(a). {profile.first_name} {profile.last_name}
                  </h1>
                  <ShieldCheck className="text-mint" />
                </div>
                <p className="mt-1 text-slate-500">CMP {profile.cmp}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.doctor_specialties.map((item) => (
                    <span
                      className="rounded-full bg-sky-50 px-3 py-1 text-sm font-bold text-ocean"
                      key={item.specialties.name}
                    >
                      {item.specialties.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <h2 className="mt-8 text-xl font-bold">Sobre el profesional</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{profile.bio}</p>
            <h2 className="mt-8 text-xl font-bold">Modalidades disponibles</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {profile.offers_virtual && (
                <span className="flex items-center gap-2 rounded-xl bg-sky-50 p-3 font-bold text-ocean">
                  <Laptop /> Consulta virtual
                </span>
              )}
              {profile.offers_home_visit && (
                <span className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 font-bold text-mint">
                  <House /> Atención a domicilio
                </span>
              )}
            </div>
            {districts.length > 0 && (
              <>
                <h2 className="mt-8 text-xl font-bold">Distritos con atención a domicilio</h2>
                <p className="mt-3 text-slate-600">
                  {districts.map((district) => district.name).join(', ')}
                </p>
              </>
            )}
          </div>
        </article>
        <aside>
          <BookingForm
            doctorId={id}
            offersVirtual={profile.offers_virtual}
            offersHomeVisit={profile.offers_home_visit}
            districts={districts}
          />
        </aside>
      </div>
    </section>
  )
}
