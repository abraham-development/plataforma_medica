import 'server-only'

import { createInsForgeServerClient } from './server'
import { isDefinitiveAuthError } from './auth-errors'

export type WorkspaceRole = 'DOCTOR' | 'PATIENT'

export type WorkspaceAccess =
  | { status: 'granted'; userId: string }
  | { status: 'anonymous' }
  | { status: 'wrong-role' }
  | { status: 'unavailable' }

export async function resolveWorkspaceAccess(role: WorkspaceRole): Promise<WorkspaceAccess> {
  const client = await createInsForgeServerClient()
  const currentUser = await client.auth.getCurrentUser()

  if (currentUser.error) {
    return isDefinitiveAuthError(currentUser.error)
      ? { status: 'anonymous' }
      : { status: 'unavailable' }
  }
  if (!currentUser.data.user) return { status: 'anonymous' }

  const roles = await client.database
    .from('user_roles')
    .select('role')
    .eq('user_id', currentUser.data.user.id)

  if (roles.error) {
    return isDefinitiveAuthError(roles.error) ? { status: 'anonymous' } : { status: 'unavailable' }
  }

  const allowed = (roles.data ?? []).some((item) => (item as { role: string }).role === role)
  return allowed
    ? { status: 'granted', userId: currentUser.data.user.id }
    : { status: 'wrong-role' }
}
