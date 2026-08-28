/** @jest-environment node */

import { NextRequest } from 'next/server'
import { GET } from './route'

const mockExchangeOAuthCode = jest.fn()
const mockRolesEq = jest.fn()
const mockCompleteRegistration = jest.fn()

jest.mock('@insforge/sdk/ssr', () => ({
  createAuthActions: jest.fn(() => ({ exchangeOAuthCode: mockExchangeOAuthCode })),
  createServerClient: jest.fn(() => ({
    database: {
      from: jest.fn(() => ({ select: jest.fn(() => ({ eq: mockRolesEq })) })),
      rpc: mockCompleteRegistration,
    },
  })),
}))

function request(query: string, cookies: string) {
  return new NextRequest(`http://localhost:3000/api/auth/callback${query}`, {
    headers: { cookie: cookies },
  })
}

describe('Google OAuth callback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockExchangeOAuthCode.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockRolesEq.mockResolvedValue({ data: [], error: null })
    mockCompleteRegistration.mockResolvedValue({ data: 'DOCTOR', error: null })
  })

  it('completes the selected public role for a new Google registration', async () => {
    const response = await GET(
      request(
        '?insforge_code=oauth-code',
        'insforge_code_verifier=verifier; medicerca_oauth_intent=register; medicerca_oauth_role=DOCTOR; medicerca_oauth_next=/panel',
      ),
    )

    expect(mockExchangeOAuthCode).toHaveBeenCalledWith('oauth-code', 'verifier')
    expect(mockCompleteRegistration).toHaveBeenCalledWith('complete_registration', {
      initial_role: 'DOCTOR',
    })
    expect(response.headers.get('location')).toBe('http://localhost:3000/panel')
    expect(response.cookies.get('medicerca_role')?.value).toBe('DOCTOR')
    expect(response.cookies.get('insforge_code_verifier')?.value).toBe('')
  })

  it('keeps the existing role and rejects an external next path', async () => {
    mockRolesEq.mockResolvedValue({ data: [{ role: 'PATIENT' }], error: null })

    const response = await GET(
      request(
        '?insforge_code=oauth-code',
        'insforge_code_verifier=verifier; medicerca_oauth_intent=login; medicerca_oauth_next=https://example.com',
      ),
    )

    expect(mockCompleteRegistration).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toBe('http://localhost:3000/panel')
    expect(response.cookies.get('medicerca_role')?.value).toBe('PATIENT')
  })

  it('asks for a public role when Google creates an account from login', async () => {
    const response = await GET(
      request(
        '?insforge_code=oauth-code',
        'insforge_code_verifier=verifier; medicerca_oauth_intent=login',
      ),
    )

    expect(mockCompleteRegistration).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toBe('http://localhost:3000/completar-registro')
  })

  it('returns safely to registration when the provider cancels', async () => {
    const response = await GET(request('?error=access_denied', 'medicerca_oauth_intent=register'))

    expect(mockExchangeOAuthCode).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/registro?error=oauth_cancelled',
    )
  })
})
