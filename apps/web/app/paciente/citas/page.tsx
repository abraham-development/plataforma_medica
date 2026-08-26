import { DashboardShell } from '@/components/dashboard-shell'
import { AppointmentList } from '@/components/appointment-list'
export default function PatientAppointments() {
  return (
    <DashboardShell title="Mis citas" description="Próximas citas e historial." links={[]}>
      <AppointmentList role="PATIENT" />
    </DashboardShell>
  )
}
