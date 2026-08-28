import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth-forms'
import { oauthErrorMessage, safeInternalPath } from '@/lib/insforge/auth-navigation'
export const metadata: Metadata = { title: 'Iniciar sesión' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[]
    reason?: string | string[]
    error?: string | string[]
  }>
}) {
  const params = await searchParams
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason
  const oauthError = oauthErrorMessage(params.error)
  return (
    <section className="container-page py-8 sm:py-14">
      <div className="card mx-auto max-w-md p-6 sm:p-9">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-black">Bienvenido</h1>
          <p className="mt-2 text-slate-600">Accede a tus citas y tu perfil.</p>
        </div>
        {reason === 'session-expired' && (
          <p className="mb-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800" role="status">
            Tu sesión venció de forma segura. Inicia sesión nuevamente para continuar.
          </p>
        )}
        {oauthError && (
          <p className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
            {oauthError}
          </p>
        )}
        <LoginForm
          nextPath={safeInternalPath(Array.isArray(params.next) ? params.next[0] : params.next)}
        />
        <div className="mt-5 flex flex-col gap-3 text-sm sm:flex-row sm:justify-between">
          <Link className="font-bold text-ocean" href="/recuperar-contrasena">
            Olvidé mi contraseña
          </Link>
          <Link className="font-bold text-ocean" href="/registro">
            Crear cuenta
          </Link>
        </div>
      </div>
    </section>
  )
}
