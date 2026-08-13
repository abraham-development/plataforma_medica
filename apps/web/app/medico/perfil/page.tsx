import { DashboardShell } from '@/components/dashboard-shell'
import { DoctorProfileForm } from '@/components/doctor-profile-form'
const links = [
  { href: '/medico', label: 'Resumen' },
  { href: '/medico/agenda', label: 'Agenda' },
  { href: '/medico/disponibilidad', label: 'Disponibilidad' },
  { href: '/medico/perfil', label: 'Perfil profesional' },
]
export default function DoctorProfile() {
  return (
    <DashboardShell
      title="Perfil profesional"
      description="Completa tus datos para que el equipo pueda verificarlos."
      links={links}
    >
      <DoctorProfileForm />
    </DashboardShell>
  )
}
