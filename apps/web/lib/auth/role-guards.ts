import { redirect } from 'next/navigation'
import { createInsForgeServerClient } from '@/lib/insforge/server'

export async function redirectDoctorToWorkspace() {
  const client = await createInsForgeServerClient()
  const { data } = await client.auth.getCurrentUser()
  if (!data.user) return

  const { data: roles } = await client.database
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)

  if ((roles ?? []).some((item) => (item as { role: string }).role === 'DOCTOR')) {
    redirect('/medico')
  }
}
