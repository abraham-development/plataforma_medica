export type PublicRegistrationRole = 'PATIENT' | 'DOCTOR'

export function isPublicRegistrationRole(value: unknown): value is PublicRegistrationRole {
  return value === 'PATIENT' || value === 'DOCTOR'
}

export function safeInternalPath(value: unknown, fallback = '/panel') {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback
  try {
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith('//') || decoded.includes('\\')) return fallback
    const base = new URL('https://medicerca.internal')
    const resolved = new URL(value, base)
    return resolved.origin === base.origin
      ? `${resolved.pathname}${resolved.search}${resolved.hash}`
      : fallback
  } catch {
    return fallback
  }
}

export function preferredWorkspaceRole(roles: string[]) {
  return (
    roles.find((role) => role === 'ADMIN') ??
    roles.find((role) => role === 'DOCTOR') ??
    roles.find((role) => role === 'PATIENT') ??
    null
  )
}

export function oauthErrorMessage(value: string | string[] | undefined) {
  const code = Array.isArray(value) ? value[0] : value
  if (!code) return null
  if (code === 'oauth_cancelled')
    return 'Se canceló el acceso con Google. Puedes intentarlo otra vez.'
  if (code === 'oauth_role_required') {
    return 'Elige si usarás MediCerca como paciente o médico antes de continuar con Google.'
  }
  if (code === 'setup_failed') {
    return 'Google verificó tu cuenta, pero falta completar tu perfil inicial.'
  }
  return 'No pudimos completar el acceso con Google. Inténtalo nuevamente.'
}
