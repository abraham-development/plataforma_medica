import { DashboardShell } from '@/components/dashboard-shell'
import { AppointmentList } from '@/components/appointment-list'
const links = [
  { href: '/medico', label: 'Resumen' },
  { href: '/medico/agenda', label: 'Agenda' },
  { href: '/medico/disponibilidad', label: 'Disponibilidad' },
  { href: '/medico/perfil', label: 'Perfil profesional' },
]
export default function DoctorAgenda() {
  return (
    <DashboardShell
      title="Mi agenda"
      description="Consultas virtuales y atenciones a domicilio programadas."
      links={links}
    >
      <AppointmentList />
    </DashboardShell>
  )
}
