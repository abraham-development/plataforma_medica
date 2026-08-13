import { DashboardShell } from '@/components/dashboard-shell'
import { DoctorProfileForm } from '@/components/doctor-profile-form'
export default function DoctorProfile() {
  return (
    <DashboardShell
      title="Perfil profesional"
      description="Completa tus datos para que el equipo pueda verificarlos."
      links={[]}
    >
      <DoctorProfileForm />
    </DashboardShell>
  )
}
