import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/auth-forms'
export const metadata: Metadata = { title: 'Crear cuenta' }
export default function RegisterPage() {
  return (
    <section className="container-page py-14">
      <div className="card mx-auto max-w-xl p-6 sm:p-9">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-black">Crea tu cuenta</h1>
          <p className="mt-2 text-slate-600">
            Empieza con lo esencial. Completarás tu perfil después.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Te enviaremos un código OTP de 6 dígitos para confirmar tu correo.
          </p>
        </div>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tienes cuenta?{' '}
          <Link className="font-bold text-ocean" href="/login">
            Inicia sesión
          </Link>
        </p>
      </div>
    </section>
  )
}
