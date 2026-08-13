import { redirect } from 'next/navigation'
import { createInsForgeServerClient } from '@/lib/insforge/server'
export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const client = await createInsForgeServerClient()
  const { data } = await client.auth.getCurrentUser()
  if (!data.user) redirect('/login')
  const { data: roles } = await client.database
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
  if (!(roles ?? []).some((r) => (r as { role: string }).role === 'PATIENT')) redirect('/panel')
  return children
}
