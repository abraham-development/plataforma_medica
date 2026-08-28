import { createAuthActions, createServerClient } from '@insforge/sdk/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  isPublicRegistrationRole,
  preferredWorkspaceRole,
  safeInternalPath,
} from '@/lib/insforge/auth-navigation'

const oauthCookies = [
  'insforge_code_verifier',
  'medicerca_oauth_intent',
  'medicerca_oauth_next',
  'medicerca_oauth_role',
]

function clearOAuthCookies(response: NextResponse) {
  oauthCookies.forEach((name) => response.cookies.delete(name))
  return response
}

function appUrl(request: NextRequest, path: string) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL
  try {
    return new URL(path, configuredOrigin || request.nextUrl.origin)
  } catch {
    return new URL(path, request.nextUrl.origin)
  }
}

function oauthFailure(request: NextRequest, code: string) {
  const registration = request.cookies.get('medicerca_oauth_intent')?.value === 'register'
  const path = registration ? '/registro' : '/login'
  const url = appUrl(request, path)
  url.searchParams.set('error', code)
  const response = clearOAuthCookies(NextResponse.redirect(url))
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('insforge_code')
  const providerError = request.nextUrl.searchParams.get('error')
  const verifier = request.cookies.get('insforge_code_verifier')?.value

  if (providerError || !code) return oauthFailure(request, 'oauth_cancelled')
  if (!verifier) return oauthFailure(request, 'oauth_missing_verifier')

  const response = NextResponse.redirect(appUrl(request, '/panel'))
  response.headers.set('Cache-Control', 'private, no-store')
  const auth = createAuthActions({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  })
  const exchange = await auth.exchangeOAuthCode(code, verifier)
  if (exchange.error || !exchange.data?.user) {
    return oauthFailure(request, 'oauth_exchange_failed')
  }

  const client = createServerClient({ cookies: response.cookies })
  const rolesResult = await client.database
    .from('user_roles')
    .select('role')
    .eq('user_id', exchange.data.user.id)

  if (rolesResult.error) {
    response.headers.set('Location', appUrl(request, '/panel').toString())
    return clearOAuthCookies(response)
  }

  const roles = (rolesResult.data ?? []).map((item) => (item as { role: string }).role)
  let role = preferredWorkspaceRole(roles)

  if (!role) {
    const requestedRole = request.cookies.get('medicerca_oauth_role')?.value
    if (isPublicRegistrationRole(requestedRole)) {
      const registration = await client.database.rpc('complete_registration', {
        initial_role: requestedRole,
      })
      if (registration.error) {
        response.headers.set(
          'Location',
          appUrl(request, '/completar-registro?error=setup_failed').toString(),
        )
        return clearOAuthCookies(response)
      }
      role = requestedRole
    } else {
      response.headers.set('Location', appUrl(request, '/completar-registro').toString())
      return clearOAuthCookies(response)
    }
  }

  response.cookies.set('medicerca_role', role, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  const nextPath = safeInternalPath(request.cookies.get('medicerca_oauth_next')?.value, '/panel')
  response.headers.set('Location', appUrl(request, nextPath).toString())
  return clearOAuthCookies(response)
}
