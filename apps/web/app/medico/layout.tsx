import { redirect } from 'next/navigation'
import { WorkspaceUnavailable } from '@/components/workspace-unavailable'
import { resolveWorkspaceAccess } from '@/lib/insforge/workspace-session'

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const access = await resolveWorkspaceAccess('DOCTOR')
  if (access.status === 'anonymous') redirect('/login?next=/medico')
  if (access.status === 'wrong-role') redirect('/panel')
  if (access.status === 'unavailable') return <WorkspaceUnavailable />
  return children
}
