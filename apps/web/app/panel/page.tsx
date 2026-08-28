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
  redirect('/completar-registro')
}
