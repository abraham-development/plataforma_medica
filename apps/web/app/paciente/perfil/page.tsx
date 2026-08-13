import { DashboardShell } from '@/components/dashboard-shell'
import { PatientProfileForm } from '@/components/patient-profile-form'
const links = [
  { href: '/paciente', label: 'Resumen' },
  { href: '/paciente/citas', label: 'Mis citas' },
  { href: '/paciente/perfil', label: 'Mi perfil' },
  { href: '/medicos', label: 'Buscar médicos' },
]
export default function PatientProfile() {
  return (
    <DashboardShell title="Mi perfil" description="Completa tus nombres y apellidos." links={links}>
      <PatientProfileForm />
    </DashboardShell>
  )
}
