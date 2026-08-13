import { DashboardShell } from '@/components/dashboard-shell'
import { AppointmentList } from '@/components/appointment-list'
const links = [
  { href: '/paciente', label: 'Resumen' },
  { href: '/paciente/citas', label: 'Mis citas' },
  { href: '/paciente/perfil', label: 'Mi perfil' },
  { href: '/medicos', label: 'Buscar médicos' },
]
export default function PatientAppointments() {
  return (
    <DashboardShell title="Mis citas" description="Próximas citas e historial." links={links}>
      <AppointmentList />
    </DashboardShell>
  )
}
