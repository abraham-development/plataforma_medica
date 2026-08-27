import { DashboardShell } from '@/components/dashboard-shell'
import { AdminTable } from '@/components/admin-table'
import { adminWorkspaceLinks } from '@/lib/admin-workspace'

export default function Page() {
  return (
    <DashboardShell
      title="Usuarios"
      description="Cuentas y estado operativo."
      links={[...adminWorkspaceLinks]}
    >
      <AdminTable
        table="users"
        select="id,display_name,account_status,created_at,user_roles(role)"
        title="Usuarios registrados"
      />
    </DashboardShell>
  )
}
