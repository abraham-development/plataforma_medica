import { DashboardShell } from '@/components/dashboard-shell'
import { AvailabilityForm } from '@/components/availability-form'
const links = [
  { href: '/medico', label: 'Resumen' },
  { href: '/medico/agenda', label: 'Agenda' },
  { href: '/medico/disponibilidad', label: 'Disponibilidad' },
  { href: '/medico/perfil', label: 'Perfil profesional' },
]
export default function AvailabilityPage() {
  return (
    <DashboardShell
      title="Disponibilidad"
      description="Define bloques de 30 minutos para consulta virtual o atención a domicilio."
      links={links}
    >
      <AvailabilityForm />
    </DashboardShell>
  )
}
