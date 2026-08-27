import { DashboardShell } from '@/components/dashboard-shell'
import { PayoutMethodsForm } from '@/components/payout-methods-form'

export default function PayoutMethodsPage() {
  return (
    <DashboardShell
      title="Método de pago"
      description="Indica dónde quieres recibir las transferencias de MediCerca."
      links={[]}
    >
      <PayoutMethodsForm />
    </DashboardShell>
  )
}
