import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@insforge/sdk/ssr/middleware'

export async function proxy(request: NextRequest) {
  if (
    request.cookies.get('medicerca_role')?.value === 'DOCTOR' &&
    request.nextUrl.pathname.startsWith('/medicos')
  ) {
    return NextResponse.redirect(new URL('/medico', request.url))
  }
  const response = NextResponse.next({ request })
  await updateSession({ requestCookies: request.cookies, responseCookies: response.cookies })
  return response
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
