import { DashboardShell } from '@/components/dashboard-shell'
import { AvailabilityForm } from '@/components/availability-form'
export default function AvailabilityPage() {
  return (
    <DashboardShell
      title="Disponibilidad"
      description="Selecciona fechas y bloques de 30 minutos para consulta virtual o atención a domicilio."
      links={[]}
    >
      <AvailabilityForm />
    </DashboardShell>
  )
}
