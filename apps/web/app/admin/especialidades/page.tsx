import { DashboardShell } from '@/components/dashboard-shell'
import { AdminTable } from '@/components/admin-table'
import { adminWorkspaceLinks } from '@/lib/admin-workspace'

export default function Page() {
  return (
    <DashboardShell
      title="Especialidades"
      description="Catálogo administrable del marketplace."
      links={[...adminWorkspaceLinks]}
    >
      <AdminTable
        table="specialties"
        select="id,name,slug,active,created_at"
        title="Especialidades"
      />
    </DashboardShell>
  )
}
