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
      title="Citas"
      description="Vista operativa sin información clínica."
      links={links}
    >
      <AdminTable
        table="appointments"
        select="id,patient_id,doctor_id,consultation_mode,starts_at,status,created_at"
        title="Citas"
      />
    </DashboardShell>
  )
}
