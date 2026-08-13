import type { Metadata } from 'next'
import { createClient } from '@insforge/sdk'
import { DoctorSearch } from '@/components/doctor-search'
import { redirectDoctorToWorkspace } from '@/lib/auth/role-guards'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Buscar médicos' }
export default async function DoctorsPage() {
  await redirectDoctorToWorkspace()
  const client = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
  })
  const { data } = await client.database
    .from('doctor_profiles')
    .select('user_id,first_name,last_name,cmp,bio,avatar_url,offers_virtual,offers_home_visit')
    .eq('verification_status', 'VERIFIED')
    .limit(50)
  return (
    <section className="container-page py-14">
      <h1 className="text-4xl font-black">Encuentra tu médico</h1>
      <p className="mt-3 text-lg text-slate-600">
        Consulta virtual o atención a domicilio en Lima y Callao.
      </p>
      <DoctorSearch doctors={(data ?? []) as never} />
    </section>
  )
}
