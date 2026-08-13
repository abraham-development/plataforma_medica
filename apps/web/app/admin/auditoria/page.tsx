import { DashboardShell } from '@/components/dashboard-shell'
import { AdminTable } from '@/components/admin-table'
const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/medicos', label: 'Médicos' },
  { href: '/admin/usuarios', label: 'Usuarios' },
  { href: '/admin/especialidades', label: 'Especialidades' },
  { href: '/admin/citas', label: 'Citas' },
  { href: '/admin/auditoria', label: 'Auditoría' },
]
export default function Page() {
  return (
    <DashboardShell
      title="Auditoría"
      description="Trazabilidad de acciones administrativas sensibles."
      links={links}
    >
      <AdminTable
        table="admin_audit_logs"
        select="id,admin_user_id,action,entity_type,entity_id,metadata,created_at"
        title="Registro de auditoría"
      />
    </DashboardShell>
  )
}
