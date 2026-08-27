import { DashboardShell } from '@/components/dashboard-shell'
import { AdminTable } from '@/components/admin-table'
import { adminWorkspaceLinks } from '@/lib/admin-workspace'

export default function Page() {
  return (
    <DashboardShell
      title="Citas"
      description="Vista operativa sin información clínica."
      links={[...adminWorkspaceLinks]}
    >
      <AdminTable
        table="appointments"
        select="id,patient_id,doctor_id,consultation_mode,starts_at,status,created_at"
        title="Citas"
      />
    </DashboardShell>
  )
}
