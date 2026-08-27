import { DashboardShell } from '@/components/dashboard-shell'
import { AdminDashboard } from '@/components/admin-dashboard'
import { adminWorkspaceLinks } from '@/lib/admin-workspace'

export default function AdminPage() {
  return (
    <DashboardShell
      title="Administración"
      description="Operación segura y auditada de MediCerca."
      links={[...adminWorkspaceLinks]}
    >
      <AdminDashboard />
    </DashboardShell>
  )
}
