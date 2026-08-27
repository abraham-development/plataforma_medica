import { DashboardShell } from '@/components/dashboard-shell'
import { AdminDashboard } from '@/components/admin-dashboard'
import { adminWorkspaceLinks } from '@/lib/admin-workspace'

export default function AdminDoctors() {
  return (
    <DashboardShell
      title="Médicos"
      description="Verifica, rechaza o suspende perfiles profesionales."
      links={[...adminWorkspaceLinks]}
    >
      <AdminDashboard />
    </DashboardShell>
  )
}
