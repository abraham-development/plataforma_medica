jest.mock('./client', () => ({
  insforge: { auth: { getCurrentUser: jest.fn() } },
}))

import { insforge } from './client'
import {
  authenticatedApiFetch,
  SessionExpiredError,
  SessionUnavailableError,
} from './authenticated-fetch'

const getCurrentUser = jest.mocked(insforge.auth.getCurrentUser)

function setAccessToken(value: string) {
  document.cookie = `insforge_access_token=${encodeURIComponent(value)}; path=/`
}

function mockResponse(status = 200) {
  return { ok: status >= 200 && status < 300, status } as Response
}

describe('authenticatedApiFetch', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    document.cookie = 'insforge_access_token=; Max-Age=0; path=/'
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.test/api/v1'
    getCurrentUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null } as never)
    global.fetch = jest.fn()
  })

  it('adds the current bearer token', async () => {
    setAccessToken('access-one')
    const fetchMock = jest.mocked(global.fetch)
    fetchMock.mockResolvedValue(mockResponse())

    await authenticatedApiFetch('/appointments/me')

    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/api/v1/appointments/me')
    expect(headers.get('Authorization')).toBe('Bearer access-one')
  })

  it('refreshes once and retries a rejected API request', async () => {
    setAccessToken('access-old')
    const fetchMock = jest.mocked(global.fetch)
    fetchMock
      .mockResolvedValueOnce(mockResponse(401))
      .mockImplementationOnce(async () => {
        setAccessToken('access-new')
        return mockResponse()
      })
      .mockResolvedValueOnce(mockResponse())

    const response = await authenticatedApiFetch('/appointments/me')

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    const retryHeaders = new Headers(fetchMock.mock.calls[2][1]?.headers)
    expect(retryHeaders.get('Authorization')).toBe('Bearer access-new')
  })

  it('keeps a transient verification error distinct from an expired session', async () => {
    setAccessToken('access-one')
    getCurrentUser.mockResolvedValue({
      data: { user: null },
      error: { statusCode: 503, message: 'Temporarily unavailable' },
    } as never)

    await expect(authenticatedApiFetch('/appointments/me')).rejects.toBeInstanceOf(
      SessionUnavailableError,
    )
  })

  it('reports a definitive authentication failure as expired', async () => {
    setAccessToken('access-one')
    getCurrentUser.mockResolvedValue({
      data: { user: null },
      error: { statusCode: 401, message: 'Unauthorized' },
    } as never)

    await expect(authenticatedApiFetch('/appointments/me')).rejects.toBeInstanceOf(
      SessionExpiredError,
    )
  })
})
