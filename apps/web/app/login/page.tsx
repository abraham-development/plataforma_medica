import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth-forms'
export const metadata: Metadata = { title: 'Iniciar sesión' }
export default function LoginPage() {
  return (
    <section className="container-page py-14">
      <div className="card mx-auto max-w-md p-6 sm:p-9">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-black">Bienvenido</h1>
          <p className="mt-2 text-slate-600">Accede a tus citas y tu perfil.</p>
        </div>
        <LoginForm />
        <div className="mt-5 flex justify-between text-sm">
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
