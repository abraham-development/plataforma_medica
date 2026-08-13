import type { Metadata } from 'next'
import { ResetForm } from '@/components/auth-forms'
export const metadata: Metadata = { title: 'Recuperar contraseña' }
export default function ResetPage() {
  return (
    <section className="container-page py-14">
      <div className="card mx-auto max-w-md p-6 sm:p-9">
        <h1 className="text-center text-3xl font-black">Recupera tu acceso</h1>
        <p className="mb-7 mt-2 text-center text-slate-600">
          Te enviaremos un código seguro por correo.
        </p>
        <ResetForm />
      </div>
    </section>
  )
}
