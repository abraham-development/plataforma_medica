import { DashboardShell } from '@/components/dashboard-shell'
import { AdminDashboard } from '@/components/admin-dashboard'
const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/medicos', label: 'Médicos' },
  { href: '/admin/usuarios', label: 'Usuarios' },
  { href: '/admin/especialidades', label: 'Especialidades' },
  { href: '/admin/citas', label: 'Citas' },
  { href: '/admin/auditoria', label: 'Auditoría' },
]
export default function AdminPage() {
  return (
    <DashboardShell
      title="Administración"
      description="Operación segura y auditada de MediCerca."
      links={links}
    >
      <AdminDashboard />
    </DashboardShell>
  )
}
