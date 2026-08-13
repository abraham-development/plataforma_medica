import { createClient } from '@insforge/sdk'
import { Stethoscope } from 'lucide-react'
export const dynamic = 'force-dynamic'
export default async function SpecialtiesPage() {
  const client = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
  })
  const { data } = await client.database
    .from('specialties')
    .select('id,name,slug')
    .eq('active', true)
    .order('name')
  return (
    <section className="container-page py-14">
      <h1 className="text-4xl font-black">Especialidades</h1>
      <p className="mt-3 text-slate-600">Encuentra el profesional adecuado para tu necesidad.</p>
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((item) => (
          <article className="card flex items-center gap-4 p-5" key={(item as { id: string }).id}>
            <span className="rounded-xl bg-emerald-50 p-3 text-mint">
              <Stethoscope />
            </span>
            <h2 className="font-bold">{(item as { name: string }).name}</h2>
          </article>
        ))}
      </div>
    </section>
  )
}
