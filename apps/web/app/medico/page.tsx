import { DashboardShell } from '@/components/dashboard-shell'
import { AppointmentList } from '@/components/appointment-list'
const links = [
  { href: '/medico', label: 'Resumen' },
  { href: '/medico/agenda', label: 'Agenda' },
  { href: '/medico/disponibilidad', label: 'Disponibilidad' },
  { href: '/medico/perfil', label: 'Perfil profesional' },
]
export default function DoctorDashboard() {
  return (
    <DashboardShell
      title="Panel médico"
      description="Administra tu perfil, agenda y citas."
      links={links}
    >
      <AppointmentList />
    </DashboardShell>
  )
}
