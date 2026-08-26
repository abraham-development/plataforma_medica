import { redirect } from 'next/navigation'
import { WorkspaceUnavailable } from '@/components/workspace-unavailable'
import { resolveWorkspaceAccess } from '@/lib/insforge/workspace-session'

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const access = await resolveWorkspaceAccess('PATIENT')
  if (access.status === 'anonymous') redirect('/login?next=/paciente')
  if (access.status === 'wrong-role') redirect('/panel')
  if (access.status === 'unavailable') return <WorkspaceUnavailable />
  return children
}
