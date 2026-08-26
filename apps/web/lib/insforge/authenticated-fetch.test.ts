import {
  authenticatedApiFetch,
  SessionExpiredError,
  SessionUnavailableError,
} from './authenticated-fetch'

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

  it('uses the same-origin refresh route when the access cookie is missing', async () => {
    const fetchMock = jest.mocked(global.fetch)
    fetchMock
      .mockImplementationOnce(async () => {
        setAccessToken('access-restored')
        return mockResponse()
      })
      .mockResolvedValueOnce(mockResponse())

    await authenticatedApiFetch('/appointments/me')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/refresh')
    const headers = new Headers(fetchMock.mock.calls[1][1]?.headers)
    expect(headers.get('Authorization')).toBe('Bearer access-restored')
  })

  it('keeps a transient refresh failure distinct from an expired session', async () => {
    jest.mocked(global.fetch).mockResolvedValue(mockResponse(503))

    await expect(authenticatedApiFetch('/appointments/me')).rejects.toBeInstanceOf(
      SessionUnavailableError,
    )
  })

  it('reports a definitive refresh failure as expired', async () => {
    jest.mocked(global.fetch).mockResolvedValue(mockResponse(401))

    await expect(authenticatedApiFetch('/appointments/me')).rejects.toBeInstanceOf(
      SessionExpiredError,
    )
  })
})
