'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from '@/app/actions/auth'
import { doctorWorkspaceLinks, isDoctorWorkspacePath } from '@/lib/doctor-workspace'
import { insforge } from '@/lib/insforge/client'

type SessionState = {
  status: 'loading' | 'anonymous' | 'authenticated'
  role: string | null
}

function MobileNavigation({
  id,
  label,
  links,
}: {
  id: string
  label: string
  links: readonly { href: string; label: string }[]
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return

    function closeOnOutsidePress(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePress)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div className="relative md:hidden" ref={container}>
      <button
        aria-controls={id}
        aria-expanded={open}
        aria-label={`${open ? 'Cerrar' : 'Abrir'} ${label.toLowerCase()}`}
        className="flex min-h-11 items-center gap-2 py-2 font-bold"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? <X size={20} /> : <Menu size={20} />} {label}
      </button>
      {open && (
        <div
          className="absolute left-0 top-11 z-50 grid w-[min(17rem,calc(100vw-1.25rem))] gap-1 rounded-2xl border bg-white p-3 shadow-soft"
          id={id}
        >
          {links.map((link) => (
            <Link
              className="rounded-xl p-3 hover:bg-cloud"
              href={link.href}
              key={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Brand({ doctor = false }: { doctor?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <Link
        className="shrink-0"
        href={doctor ? '/medico' : '/'}
        aria-label={doctor ? 'MediCerca, ir al panel médico' : 'MediCerca, ir al inicio'}
      >
        <Image
          src="/logo.svg"
          alt="MediCerca"
          width={220}
          height={52}
          priority
          className="h-8 w-auto sm:h-11"
        />
      </Link>
      {doctor && (
        <span className="hidden whitespace-nowrap border-l border-slate-200 pl-4 text-sm font-bold text-ocean sm:inline">
          Panel médico
        </span>
      )}
    </div>
  )
}

function DoctorHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="border-b border-slate-100">
        <div className="container-page flex min-h-16 items-center justify-between gap-3 sm:min-h-20">
          <Brand doctor />
          <form action={signOut}>
            <button className="btn-secondary whitespace-nowrap !px-3 !py-2 text-sm sm:!px-4 sm:!py-3 sm:text-base" type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
      <nav
        aria-label="Navegación del espacio médico"
        className="container-page flex min-h-12 items-center justify-between gap-3 sm:min-h-14"
      >
        <div className="hidden items-center gap-5 font-semibold md:flex lg:gap-8">
          {doctorWorkspaceLinks.map((link) => (
            <Link className="rounded-lg py-2 hover:text-mint" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <MobileNavigation
          id="mobile-doctor-navigation"
          label="Menú médico"
          links={doctorWorkspaceLinks}
        />
        <span className="ml-auto whitespace-nowrap text-xs font-semibold text-mint sm:text-sm">
          Área profesional
        </span>
      </nav>
    </header>
  )
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<SessionState>({ status: 'loading', role: null })

  const loadSession = useCallback(async () => {
    const { data } = await insforge.auth.getCurrentUser()
    if (!data.user) {
      setSession({ status: 'anonymous', role: null })
      return
    }

    const { data: roles } = await insforge.database
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
    const values = (roles ?? []) as { role: string }[]
    setSession({
      status: 'authenticated',
      role: values.find((item) => item.role === 'DOCTOR')?.role ?? values[0]?.role ?? null,
    })
  }, [])

  useEffect(() => {
    void loadSession()
    window.addEventListener('medicerca:auth-changed', loadSession)
    return () => window.removeEventListener('medicerca:auth-changed', loadSession)
  }, [loadSession])

  useEffect(() => {
    if (session.role === 'DOCTOR' && pathname.startsWith('/medicos')) {
      router.replace('/medico')
    }
  }, [pathname, router, session.role])

  if (isDoctorWorkspacePath(pathname) || session.role === 'DOCTOR') return <DoctorHeader />

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="border-b border-slate-100">
        <div className="container-page flex min-h-16 items-center justify-between gap-2 sm:min-h-20 sm:gap-4">
          <Brand />
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {session.status === 'loading' ? (
              <div aria-label="Comprobando sesión" className="h-10 w-36 animate-pulse rounded-xl bg-slate-100 sm:w-52" />
            ) : session.status === 'authenticated' ? (
              <>
                <Link className="btn-secondary hidden sm:inline-flex" href="/panel">
                  Mi cuenta
                </Link>
                <form action={signOut}>
                  <button className="btn-primary whitespace-nowrap !px-3 !py-2 text-sm sm:!px-4 sm:!py-3 sm:text-base" type="submit">
                    Cerrar sesión
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link className="btn-secondary whitespace-nowrap !px-3 !py-2 text-sm sm:!px-4 sm:!py-3 sm:text-base" href="/login">
                  <span className="sm:hidden">Entrar</span>
                  <span className="hidden sm:inline">Iniciar sesión</span>
                </Link>
                <Link className="btn-primary whitespace-nowrap !px-3 !py-2 text-sm sm:!px-4 sm:!py-3 sm:text-base" href="/registro">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <nav
        aria-label="Navegación principal"
        className="container-page flex min-h-12 items-center justify-between gap-3 sm:min-h-14"
      >
        <div className="hidden items-center gap-5 font-semibold md:flex lg:gap-8">
          <Link className="rounded-lg py-2 hover:text-mint" href="/">Inicio</Link>
          <Link className="rounded-lg py-2 hover:text-mint" href="/medicos">Buscar médicos</Link>
          <Link className="rounded-lg py-2 hover:text-mint" href="/#como-funciona">Cómo funciona</Link>
        </div>
        <MobileNavigation
          id="mobile-public-navigation"
          label="Menú"
          links={[
            { href: '/', label: 'Inicio' },
            { href: '/medicos', label: 'Buscar médicos' },
            { href: '/#como-funciona', label: 'Cómo funciona' },
          ]}
        />
        <span className="ml-auto whitespace-nowrap text-xs font-semibold text-ocean sm:text-sm">
          Lima Metropolitana
        </span>
      </nav>
    </header>
  )
}
