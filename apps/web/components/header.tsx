import Image from 'next/image'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { signOut } from '@/app/actions/auth'

export async function Header() {
  const client = await createInsForgeServerClient()
  const { data } = await client.auth.getCurrentUser()
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="border-b border-slate-100">
        <div className="container-page flex min-h-20 items-center justify-between gap-4">
          <Link href="/" aria-label="MediCerca, ir al inicio">
            <Image
              src="/logo.svg"
              alt="MediCerca"
              width={220}
              height={52}
              priority
              className="h-11 w-auto"
            />
          </Link>
          <div className="flex items-center gap-2">
            {data?.user ? (
              <>
                <Link className="btn-secondary hidden sm:inline-flex" href="/panel">
                  Mi cuenta
                </Link>
                <form action={signOut}>
                  <button className="btn-primary" type="submit">
                    Cerrar sesión
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link className="btn-secondary" href="/login">
                  Iniciar sesión
                </Link>
                <Link className="btn-primary" href="/registro">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <nav
        aria-label="Navegación principal"
        className="container-page flex min-h-14 items-center justify-between"
      >
        <div className="hidden items-center gap-8 font-semibold md:flex">
          <Link href="/">Inicio</Link>
          <Link href="/medicos">Buscar médicos</Link>
          <Link href="/especialidades">Especialidades</Link>
          <Link href="/#como-funciona">Cómo funciona</Link>
        </div>
        <details className="relative md:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 py-3 font-bold">
            <Menu size={20} /> Menú
          </summary>
          <div className="absolute left-0 top-12 grid min-w-64 gap-1 rounded-2xl border bg-white p-3 shadow-soft">
            <Link className="p-3" href="/">
              Inicio
            </Link>
            <Link className="p-3" href="/medicos">
              Buscar médicos
            </Link>
            <Link className="p-3" href="/especialidades">
              Especialidades
            </Link>
            <Link className="p-3" href="/#como-funciona">
              Cómo funciona
            </Link>
          </div>
        </details>
        <span className="ml-auto text-sm font-semibold text-ocean">Lima y Callao</span>
      </nav>
    </header>
  )
}
