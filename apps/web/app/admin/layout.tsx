import { redirect } from 'next/navigation'
import { createInsForgeServerClient } from '@/lib/insforge/server'
export const metadata = { robots: { index: false, follow: false } }
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const client = await createInsForgeServerClient()
  const { data } = await client.auth.getCurrentUser()
  if (!data.user) redirect('/login')
  const { data: roles } = await client.database
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
  if (!(roles ?? []).some((r) => (r as { role: string }).role === 'ADMIN')) redirect('/panel')
  return children
}
