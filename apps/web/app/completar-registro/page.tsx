import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { OAuthRoleForm } from '@/components/auth-forms'
import { oauthErrorMessage, preferredWorkspaceRole } from '@/lib/insforge/auth-navigation'
import { createInsForgeServerClient } from '@/lib/insforge/server'

export const metadata: Metadata = { title: 'Completar registro' }
export const dynamic = 'force-dynamic'

export default async function CompleteRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>
}) {
  const client = await createInsForgeServerClient()
  const currentUser = await client.auth.getCurrentUser()
  if (currentUser.error || !currentUser.data.user) redirect('/login')

  const roles = await client.database
    .from('user_roles')
    .select('role')
    .eq('user_id', currentUser.data.user.id)
  const role = preferredWorkspaceRole(
    (roles.data ?? []).map((item) => (item as { role: string }).role),
  )
  if (role) redirect('/panel')
  const setupError = oauthErrorMessage((await searchParams).error)

  return (
    <section className="container-page py-8 sm:py-14">
      <div className="card mx-auto max-w-lg p-6 sm:p-9">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-black">Completa tu registro</h1>
          <p className="mt-2 text-slate-600">
            Tu cuenta de Google ya fue verificada. Indica cómo usarás MediCerca para preparar tu
            panel.
          </p>
        </div>
        {(roles.error || setupError) && (
          <p className="mb-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800" role="alert">
            {setupError ?? 'No pudimos comprobar tu rol. Puedes intentarlo nuevamente.'}
          </p>
        )}
        <OAuthRoleForm />
      </div>
    </section>
  )
}
