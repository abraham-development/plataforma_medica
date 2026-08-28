import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/auth-forms'
import { oauthErrorMessage } from '@/lib/insforge/auth-navigation'
export const metadata: Metadata = { title: 'Crear cuenta' }
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>
}) {
  const oauthError = oauthErrorMessage((await searchParams).error)
  return (
    <section className="container-page py-8 sm:py-14">
      <div className="card mx-auto max-w-xl p-6 sm:p-9">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-black">Crea tu cuenta</h1>
          <p className="mt-2 text-slate-600">
            Empieza con lo esencial. Completarás tu perfil después.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Con correo te enviaremos un código OTP de 6 dígitos; Google verifica tu correo durante
            el acceso.
          </p>
        </div>
        {oauthError && (
          <p className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
            {oauthError}
          </p>
        )}
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
