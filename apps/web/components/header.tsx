'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, Menu, UserRound, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from '@/app/actions/auth'
import {
  doctorWorkspace,
  type WorkspaceDefinition,
  type WorkspaceRole,
  workspaceForPath,
} from '@/lib/doctor-workspace'
import { insforge } from '@/lib/insforge/client'

type SessionState = {
  status: 'loading' | 'anonymous' | 'authenticated' | 'unavailable'
  role: string | null
  displayName: string | null
}

const anonymousSession: SessionState = { status: 'anonymous', role: null, displayName: null }
const SESSION_TIMEOUT_MS = 4_000

function hasBrowserInsforgeConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY

  return Boolean(
    baseUrl && anonKey && !baseUrl.includes('://example.') && anonKey !== 'ci-placeholder',
  )
}

async function resolveBrowserSession(preferredRole?: WorkspaceRole): Promise<SessionState> {
  const { data, error } = await insforge.auth.getCurrentUser()
  if (error) throw error
  if (!data.user) return anonymousSession

  const { data: roles, error: rolesError } = await insforge.database
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
  if (rolesError) throw rolesError
  const values = (roles ?? []) as { role: string }[]
  const availableRoles = values.map((item) => item.role)
  const role =
    preferredRole && availableRoles.includes(preferredRole)
      ? preferredRole
      : (availableRoles.find((item) => item === 'DOCTOR') ?? availableRoles[0] ?? null)

  const profileTable = role === 'DOCTOR' ? 'doctor_profiles' : 'patient_profiles'
  const [account, profile] = await Promise.all([
    insforge.database.from('users').select('display_name').eq('id', data.user.id).maybeSingle(),
    role === 'DOCTOR' || role === 'PATIENT'
      ? insforge.database
          .from(profileTable)
          .select('first_name,last_name')
          .eq('user_id', data.user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  const profileValue = profile.data as {
    first_name?: string | null
    last_name?: string | null
  } | null
  const accountValue = account.data as { display_name?: string | null } | null
  const profileName = [profileValue?.first_name, profileValue?.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')

  return {
    status: 'authenticated',
    role,
    displayName: profileName || accountValue?.display_name?.trim() || null,
  }
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

function Brand({ workspace }: { workspace?: WorkspaceDefinition }) {
  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <Link
        className="shrink-0"
        href={workspace?.home ?? '/'}
        aria-label={
          workspace ? `MediCerca, ir a ${workspace.title.toLowerCase()}` : 'MediCerca, ir al inicio'
        }
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
      {workspace && (
        <span className="hidden whitespace-nowrap border-l border-slate-200 pl-4 text-sm font-bold text-ocean sm:inline">
          {workspace.title}
        </span>
      )}
    </div>
  )
}

function AccountMenu({
  displayName,
  workspace,
}: {
  displayName: string | null
  workspace: WorkspaceDefinition
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const name = displayName || 'Mi cuenta'

  useEffect(() => setOpen(false), [pathname])

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
    <div className="relative" ref={container}>
      <button
        aria-controls="workspace-account-menu"
        aria-expanded={open}
        aria-label={`Abrir menú de cuenta de ${name}`}
        className="flex min-h-11 max-w-[12rem] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/40 sm:max-w-[17rem]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-mint">
          <UserRound size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm text-ink">{name}</strong>
          <span className="hidden truncate text-xs font-semibold text-slate-500 sm:block">
            {workspace.title}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
          size={17}
        />
      </button>
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+.5rem)] z-50 grid w-56 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft"
          id="workspace-account-menu"
        >
          <div className="border-b border-slate-100 px-3 py-2 sm:hidden">
            <p className="truncate text-sm font-black">{name}</p>
            <p className="text-xs font-semibold text-slate-500">{workspace.title}</p>
          </div>
          <Link
            className="rounded-xl px-3 py-2.5 font-bold hover:bg-cloud"
            href={workspace.profile}
          >
            Mi perfil
          </Link>
          <form action={signOut}>
            <button
              className="w-full rounded-xl px-3 py-2.5 text-left font-bold text-red-700 hover:bg-red-50"
              type="submit"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function isActiveWorkspaceLink(pathname: string, workspace: WorkspaceDefinition, href: string) {
  if (href === workspace.home) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function WorkspaceHeader({
  displayName,
  workspace,
}: {
  displayName: string | null
  workspace: WorkspaceDefinition
}) {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="border-b border-slate-100">
        <div className="container-page flex min-h-16 items-center justify-between gap-3 sm:min-h-20">
          <Brand workspace={workspace} />
          <AccountMenu displayName={displayName} workspace={workspace} />
        </div>
      </div>
      <nav
        aria-label={workspace.navigationLabel}
        className="container-page flex min-h-12 items-center justify-between gap-3 sm:min-h-14"
      >
        <div className="hidden items-center gap-5 font-semibold md:flex lg:gap-8">
          {workspace.links.map((link) => (
            <Link
              aria-current={
                isActiveWorkspaceLink(pathname, workspace, link.href) ? 'page' : undefined
              }
              className={`rounded-lg py-2 transition hover:text-mint ${
                isActiveWorkspaceLink(pathname, workspace, link.href) ? 'font-black text-mint' : ''
              }`}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <MobileNavigation
          id={`mobile-${workspace.role.toLowerCase()}-navigation`}
          label={workspace.mobileLabel}
          links={workspace.links}
        />
        <span className="ml-auto whitespace-nowrap text-xs font-semibold text-mint sm:text-sm">
          {workspace.areaLabel}
        </span>
      </nav>
    </header>
  )
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const workspace = workspaceForPath(pathname)
  const [session, setSession] = useState<SessionState>({
    status: 'loading',
    role: null,
    displayName: null,
  })

  const loadSession = useCallback(async () => {
    if (!hasBrowserInsforgeConfig()) {
      setSession(anonymousSession)
      return
    }

    if (workspace) {
      try {
        setSession(await resolveBrowserSession(workspace.role))
      } catch {
        setSession({ status: 'unavailable', role: workspace.role, displayName: null })
      }
      return
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined

    try {
      const nextSession = await Promise.race([
        resolveBrowserSession(),
        new Promise<SessionState>((resolve) => {
          timeoutId = setTimeout(() => resolve(anonymousSession), SESSION_TIMEOUT_MS)
        }),
      ])
      setSession(nextSession)
    } catch {
      setSession(anonymousSession)
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [workspace])

  useEffect(() => {
    void loadSession()
    window.addEventListener('medicerca:auth-changed', loadSession)
    window.addEventListener('medicerca:profile-changed', loadSession)
    return () => {
      window.removeEventListener('medicerca:auth-changed', loadSession)
      window.removeEventListener('medicerca:profile-changed', loadSession)
    }
  }, [loadSession])

  useEffect(() => {
    if (session.role === 'DOCTOR' && pathname.startsWith('/medicos')) {
      router.replace('/medico')
    }
  }, [pathname, router, session.role])

  if (workspace) return <WorkspaceHeader displayName={session.displayName} workspace={workspace} />
  if (session.role === 'DOCTOR') {
    return <WorkspaceHeader displayName={session.displayName} workspace={doctorWorkspace} />
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="border-b border-slate-100">
        <div className="container-page flex min-h-16 items-center justify-between gap-2 sm:min-h-20 sm:gap-4">
          <Brand />
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {session.status === 'loading' ? (
              <div
                aria-label="Comprobando sesión"
                className="h-10 w-36 animate-pulse rounded-xl bg-slate-100 sm:w-52"
              />
            ) : session.status === 'authenticated' ? (
              <>
                <Link className="btn-secondary hidden sm:inline-flex" href="/panel">
                  {session.displayName ?? 'Mi cuenta'}
                </Link>
                <form action={signOut}>
                  <button
                    className="btn-primary whitespace-nowrap !px-3 !py-2 text-sm sm:!px-4 sm:!py-3 sm:text-base"
                    type="submit"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  className="btn-secondary whitespace-nowrap !px-3 !py-2 text-sm sm:!px-4 sm:!py-3 sm:text-base"
                  href="/login"
                >
                  <span className="sm:hidden">Entrar</span>
                  <span className="hidden sm:inline">Iniciar sesión</span>
                </Link>
                <Link
                  className="btn-primary whitespace-nowrap !px-3 !py-2 text-sm sm:!px-4 sm:!py-3 sm:text-base"
                  href="/registro"
                >
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
          <Link className="rounded-lg py-2 hover:text-mint" href="/">
            Inicio
          </Link>
          <Link className="rounded-lg py-2 hover:text-mint" href="/medicos">
            Buscar médicos
          </Link>
          <Link className="rounded-lg py-2 hover:text-mint" href="/#como-funciona">
            Cómo funciona
          </Link>
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
