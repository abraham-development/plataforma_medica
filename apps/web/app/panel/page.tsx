import { redirect } from 'next/navigation'
import { createInsForgeServerClient } from '@/lib/insforge/server'
export const dynamic = 'force-dynamic'
export default async function PanelPage() {
  const client = await createInsForgeServerClient()
  const { data } = await client.auth.getCurrentUser()
  if (!data.user) redirect('/login')
  const roles = await client.database.from('user_roles').select('role').eq('user_id', data.user.id)
  const values = (roles.data ?? []).map((item) => (item as { role: string }).role)
  if (values.includes('ADMIN')) redirect('/admin')
  if (values.includes('DOCTOR')) redirect('/medico')
  if (values.includes('PATIENT')) redirect('/paciente')
  return (
    <section className="container-page py-14">
      <div className="card p-8">
        <h1 className="text-3xl font-black">Terminemos tu registro</h1>
        <p className="mt-3 text-slate-600">
          Tu cuenta está verificada, pero falta asignar el perfil inicial. Vuelve al registro para
          completar la verificación.
        </p>
      </div>
    </section>
  )
}
