import { DashboardShell } from '@/components/dashboard-shell'
import { PatientProfileForm } from '@/components/patient-profile-form'
export default function PatientProfile() {
  return (
    <DashboardShell title="Mi perfil" description="Completa tus nombres y apellidos." links={[]}>
      <PatientProfileForm />
    </DashboardShell>
  )
}
