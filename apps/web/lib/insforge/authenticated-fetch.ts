'use client'

export class SessionExpiredError extends Error {
  constructor() {
    super('Tu sesión venció. Vuelve a iniciar sesión.')
    this.name = 'SessionExpiredError'
  }
}

export class SessionUnavailableError extends Error {
  constructor(message = 'No pudimos verificar tu sesión. Tu cuenta no se ha cerrado.') {
    super(message)
    this.name = 'SessionUnavailableError'
  }
}

function readAccessToken() {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith('insforge_access_token='))

  if (!cookie) return null

  const value = cookie.slice(cookie.indexOf('=') + 1)
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

async function currentAccessToken() {
  const token = readAccessToken()
  return token ?? refreshCurrentSession()
}

async function refreshCurrentSession() {
  let response: Response
  try {
    response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new SessionUnavailableError()
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new SessionExpiredError()
    throw new SessionUnavailableError()
  }

  const token = readAccessToken()
  if (!token) throw new SessionUnavailableError()
  return token
}

function withBearer(init: RequestInit | undefined, token: string): RequestInit {
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return { ...init, headers }
}

export async function authenticatedApiFetch(path: string, init?: RequestInit) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) throw new SessionUnavailableError('La API de MediCerca no está configurada.')

  let token = await currentAccessToken()
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, withBearer(init, token))
  } catch {
    throw new SessionUnavailableError(
      'No pudimos conectarnos con MediCerca. Tu sesión sigue activa.',
    )
  }

  if (response.status !== 401) return response

  token = await refreshCurrentSession()
  try {
    response = await fetch(`${baseUrl}${path}`, withBearer(init, token))
  } catch {
    throw new SessionUnavailableError(
      'No pudimos conectarnos con MediCerca. Tu sesión sigue activa.',
    )
  }

  if (response.status === 401 || response.status === 403) throw new SessionExpiredError()
  return response
}

export function handleSessionError(error: unknown) {
  if (!(error instanceof SessionExpiredError)) return false

  const next = `${window.location.pathname}${window.location.search}`
  window.location.assign(`/login?reason=session-expired&next=${encodeURIComponent(next)}`)
  return true
}
