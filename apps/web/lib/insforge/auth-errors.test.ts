import { isDefinitiveAuthError, isTransientAuthError } from './auth-errors'

describe('auth error classification', () => {
  it.each([408, 429, 500, 503])('treats %s as recoverable', (statusCode: number) => {
    expect(isTransientAuthError({ statusCode })).toBe(true)
    expect(isDefinitiveAuthError({ statusCode })).toBe(false)
  })

  it.each([400, 401, 403])('treats %s as a definitive session failure', (statusCode: number) => {
    expect(isTransientAuthError({ statusCode })).toBe(false)
    expect(isDefinitiveAuthError({ statusCode })).toBe(true)
  })
})
