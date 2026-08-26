import { refreshAuth } from '@insforge/sdk/ssr'
import { isTransientAuthError } from '@/lib/insforge/auth-errors'

export async function POST(request: Request) {
  const result = await refreshAuth({ request })
  if (!result.error || !isTransientAuthError(result.error)) return result.response

  const headers = new Headers(result.response.headers)
  headers.delete('set-cookie')

  return new Response(result.response.body, {
    status: result.response.status,
    statusText: result.response.statusText,
    headers,
  })
}
