import { AdminPayoutMethods } from '@/components/admin-payout-methods'
import { DashboardShell } from '@/components/dashboard-shell'
import { adminWorkspaceLinks } from '@/lib/admin-workspace'

export default function AdminPayoutMethodsPage() {
  return (
    <DashboardShell
      title="Pagos a médicos"
      description="Consulta de forma auditada los destinos indicados por cada profesional."
      links={[...adminWorkspaceLinks]}
    >
      <AdminPayoutMethods />
    </DashboardShell>
  )
}
