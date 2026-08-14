'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function SiteFooter() {
  const pathname = usePathname()
  if (pathname.startsWith('/medico')) return null

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white py-12">
      <div className="container-page grid gap-10 md:grid-cols-[1.2fr_.8fr_.8fr]">
        <div>
          <Image src="/logo.svg" alt="MediCerca" width={190} height={46} className="h-10 w-auto" />
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-600">
            Conectamos pacientes y médicos para una atención más cercana, humana y confiable.
          </p>
          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-ocean">
            <MapPin size={17} /> Lima Metropolitana
          </p>
        </div>
        <div>
          <p className="font-black">Explora</p>
          <nav className="mt-4 grid gap-3 text-sm text-slate-600" aria-label="Enlaces del pie de página">
            <Link href="/medicos">Buscar médicos</Link>
            <Link href="/#como-funciona">Cómo funciona</Link>
          </nav>
        </div>
        <div>
          <p className="font-black">Tu cuenta</p>
          <nav className="mt-4 grid gap-3 text-sm text-slate-600" aria-label="Acceso a la cuenta">
            <Link href="/login">Iniciar sesión</Link>
            <Link href="/registro">Crear cuenta</Link>
          </nav>
        </div>
      </div>
      <div className="container-page mt-10 border-t border-slate-100 pt-6 text-sm text-slate-500">
        © 2026 MediCerca. Conectando salud y cercanía.
      </div>
    </footer>
  )
}
