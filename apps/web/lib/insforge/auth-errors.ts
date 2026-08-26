export type AuthErrorLike = {
  error?: string
  message?: string
  statusCode?: number
} | null

export function isTransientAuthError(error: AuthErrorLike) {
  const status = error?.statusCode
  return status === 408 || status === 429 || status === undefined || status >= 500
}

export function isDefinitiveAuthError(error: AuthErrorLike) {
  return Boolean(error && !isTransientAuthError(error))
}
