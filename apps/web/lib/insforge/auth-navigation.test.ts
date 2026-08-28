import {
  isPublicRegistrationRole,
  oauthErrorMessage,
  preferredWorkspaceRole,
  safeInternalPath,
} from './auth-navigation'

describe('auth navigation', () => {
  it('only accepts public patient and doctor roles', () => {
    expect(isPublicRegistrationRole('PATIENT')).toBe(true)
    expect(isPublicRegistrationRole('DOCTOR')).toBe(true)
    expect(isPublicRegistrationRole('ADMIN')).toBe(false)
  })

  it('rejects external and protocol-relative post-auth redirects', () => {
    expect(safeInternalPath('/medico/agenda')).toBe('/medico/agenda')
    expect(safeInternalPath('//example.com')).toBe('/panel')
    expect(safeInternalPath('/\\example.com')).toBe('/panel')
    expect(safeInternalPath('/%2F%2Fexample.com')).toBe('/panel')
    expect(safeInternalPath('https://example.com')).toBe('/panel')
  })

  it('resolves role precedence and workspace destinations', () => {
    expect(preferredWorkspaceRole(['PATIENT', 'DOCTOR'])).toBe('DOCTOR')
    expect(preferredWorkspaceRole(['DOCTOR', 'ADMIN'])).toBe('ADMIN')
  })

  it('returns safe user-facing OAuth errors', () => {
    expect(oauthErrorMessage('oauth_cancelled')).toMatch(/canceló/i)
    expect(oauthErrorMessage('unexpected_backend_detail')).toMatch(/No pudimos/i)
  })
})
