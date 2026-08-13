import { DashboardShell } from '@/components/dashboard-shell'
import { AppointmentList } from '@/components/appointment-list'
export default function DoctorAgenda() {
  return (
    <DashboardShell
      title="Mi agenda"
      description="Consultas virtuales y atenciones a domicilio programadas."
      links={[]}
    >
      <AppointmentList />
    </DashboardShell>
  )
}
