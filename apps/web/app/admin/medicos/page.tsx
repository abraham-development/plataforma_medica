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
export default function AdminDoctors() {
  return (
    <DashboardShell
      title="Médicos"
      description="Verifica, rechaza o suspende perfiles profesionales."
      links={links}
    >
      <AdminDashboard />
    </DashboardShell>
  )
}
