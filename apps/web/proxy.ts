import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@insforge/sdk/ssr/middleware'
import { isTransientAuthError } from './lib/insforge/auth-errors'

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie))
  return target
}

function isProtectedWorkspace(pathname: string) {
  return (
    pathname === '/medico' ||
    pathname.startsWith('/medico/') ||
    pathname === '/paciente' ||
    pathname.startsWith('/paciente/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')
  )
}

export async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === '/sesion-no-disponible' ||
    request.nextUrl.pathname === '/api/auth/refresh'
  ) {
    return NextResponse.next({ request })
  }

  const response = NextResponse.next({ request })
  const session = await updateSession({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  })

  if (session.error && isTransientAuthError(session.error)) {
    if (!isProtectedWorkspace(request.nextUrl.pathname)) {
      return NextResponse.next({ request })
    }
    const recoveryUrl = new URL('/sesion-no-disponible', request.url)
    recoveryUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(recoveryUrl)
  }

  if (session.error && isProtectedWorkspace(request.nextUrl.pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('reason', 'session-expired')
    loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return copyCookies(response, NextResponse.redirect(loginUrl))
  }

  if (
    request.cookies.get('medicerca_role')?.value === 'DOCTOR' &&
    request.nextUrl.pathname.startsWith('/medicos')
  ) {
    return copyCookies(response, NextResponse.redirect(new URL('/medico', request.url)))
  }

  return response
}
export const config = {
  matcher: [
    '/((?!api/auth/refresh|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
