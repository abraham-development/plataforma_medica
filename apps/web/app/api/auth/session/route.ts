import { createInsForgeServerClient } from '@/lib/insforge/server'
import { isDefinitiveAuthError } from '@/lib/insforge/auth-errors'
import { resolveDisplayName } from '@/lib/insforge/session-identity'

const responseInit = { headers: { 'Cache-Control': 'private, no-store' } }

export async function GET() {
  try {
    const client = await createInsForgeServerClient()
    const currentUser = await client.auth.getCurrentUser()

    if (currentUser.error) {
      return Response.json(
        { authenticated: false, role: null, displayName: null },
        { ...responseInit, status: isDefinitiveAuthError(currentUser.error) ? 401 : 503 },
      )
    }
    if (!currentUser.data.user) {
      return Response.json({ authenticated: false, role: null, displayName: null }, responseInit)
    }

    const user = currentUser.data.user
    const roles = await client.database.from('user_roles').select('role').eq('user_id', user.id)
    if (roles.error) {
      return Response.json(
        { authenticated: false, role: null, displayName: null },
        { ...responseInit, status: isDefinitiveAuthError(roles.error) ? 401 : 503 },
      )
    }

    const availableRoles = (roles.data ?? []).map((item) => (item as { role: string }).role)
    const role =
      availableRoles.find((value) => value === 'DOCTOR') ??
      availableRoles.find((value) => value === 'PATIENT') ??
      availableRoles[0] ??
      null
    const profileTable = role === 'DOCTOR' ? 'doctor_profiles' : 'patient_profiles'
    const [account, profile] = await Promise.all([
      client.database.from('users').select('display_name').eq('id', user.id).maybeSingle(),
      role === 'DOCTOR' || role === 'PATIENT'
        ? client.database
            .from(profileTable)
            .select('first_name,last_name')
            .eq('user_id', user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])
    const profileValue = profile.data as {
      first_name?: string | null
      last_name?: string | null
    } | null
    const accountValue = account.data as { display_name?: string | null } | null

    return Response.json(
      {
        authenticated: true,
        role,
        displayName: resolveDisplayName({
          firstName: profileValue?.first_name,
          lastName: profileValue?.last_name,
          registrationName: user.profile?.name,
          accountName: accountValue?.display_name,
        }),
      },
      responseInit,
    )
  } catch {
    return Response.json(
      { authenticated: false, role: null, displayName: null },
      { ...responseInit, status: 503 },
    )
  }
}
