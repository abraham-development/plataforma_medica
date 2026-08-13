import Link from 'next/link'
import { Search } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'
import { AppointmentList } from '@/components/appointment-list'
const links = [
  { href: '/paciente', label: 'Resumen' },
  { href: '/paciente/citas', label: 'Mis citas' },
  { href: '/paciente/perfil', label: 'Mi perfil' },
  { href: '/medicos', label: 'Buscar médicos' },
]
export default function PatientPage() {
  return (
    <DashboardShell
      title="Panel del paciente"
      description="Gestiona tu atención desde un solo lugar."
      links={links}
    >
      <Link className="btn-primary mb-6" href="/medicos">
        <Search size={18} /> Buscar un médico
      </Link>
      <h2 className="mb-4 text-xl font-bold">Tus citas</h2>
      <AppointmentList />
    </DashboardShell>
  )
}
