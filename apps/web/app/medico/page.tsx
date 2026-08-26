import { DashboardShell } from '@/components/dashboard-shell'
import { AppointmentList } from '@/components/appointment-list'
export default function DoctorDashboard() {
  return (
    <DashboardShell
      title="Panel médico"
      description="Administra tu perfil, agenda y citas."
      links={[]}
    >
      <AppointmentList role="DOCTOR" />
    </DashboardShell>
  )
}
