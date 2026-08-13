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
    <DashboardShell title="Usuarios" description="Cuentas y estado operativo." links={links}>
      <AdminTable
        table="users"
        select="id,display_name,account_status,created_at,user_roles(role)"
        title="Usuarios registrados"
      />
    </DashboardShell>
  )
}
