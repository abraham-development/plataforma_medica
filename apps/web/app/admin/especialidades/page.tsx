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
      title="Especialidades"
      description="Catálogo administrable del marketplace."
      links={links}
    >
      <AdminTable
        table="specialties"
        select="id,name,slug,active,created_at"
        title="Especialidades"
      />
    </DashboardShell>
  )
}
