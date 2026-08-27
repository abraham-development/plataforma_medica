import { DashboardShell } from '@/components/dashboard-shell'
import { AdminTable } from '@/components/admin-table'
import { adminWorkspaceLinks } from '@/lib/admin-workspace'

export default function Page() {
  return (
    <DashboardShell
      title="Auditoría"
      description="Trazabilidad de acciones administrativas sensibles."
      links={[...adminWorkspaceLinks]}
    >
      <AdminTable
        table="admin_audit_logs"
        select="id,admin_user_id,action,entity_type,entity_id,metadata,created_at"
        title="Registro de auditoría"
      />
    </DashboardShell>
  )
}
