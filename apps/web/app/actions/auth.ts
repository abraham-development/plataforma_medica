'use server'
import { cookies } from 'next/headers'
import { createAuthActions, createServerClient } from '@insforge/sdk/ssr'
import { createClient } from '@insforge/sdk'
import { redirect } from 'next/navigation'

export type ActionState = { ok: boolean; message: string }
const initial: ActionState = { ok: false, message: '' }

function message(error: { message?: string } | null, fallback: string) {
  return error?.message ?? fallback
}

export async function signUp(
  _previous: ActionState = initial,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')
  const confirmation = String(formData.get('confirmation') ?? '')
  const role = String(formData.get('role') ?? '')
  if (!name || !email || !['PATIENT', 'DOCTOR'].includes(role))
    return { ok: false, message: 'Completa todos los campos.' }
  if (password !== confirmation) return { ok: false, message: 'Las contraseñas no coinciden.' }
  if (
    password.length < 8 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password)
  )
    return { ok: false, message: 'Usa 8 caracteres o más, con mayúscula, minúscula y número.' }
  const auth = createAuthActions({ cookies: await cookies() })
  const { data, error } = await auth.signUp({ email, password, name })
  if (error) return { ok: false, message: message(error, 'No pudimos crear tu cuenta.') }
  const cookieStore = await cookies()
  cookieStore.set('medicerca_pending_email', email, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  })
  cookieStore.set('medicerca_pending_role', role, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  })
  return {
    ok: true,
    message: data?.requireEmailVerification
      ? 'Te enviamos un código de 6 dígitos.'
      : 'Cuenta creada.',
  }
}

export async function verifyRegistration(
  _previous: ActionState = initial,
  formData: FormData,
): Promise<ActionState> {
  const store = await cookies()
  const email = store.get('medicerca_pending_email')?.value
  const role = store.get('medicerca_pending_role')?.value
  const otp = String(formData.get('otp') ?? '').replace(/\D/g, '')
  if (!email || !role)
    return { ok: false, message: 'La solicitud venció. Vuelve a crear tu cuenta.' }
  if (otp.length !== 6) return { ok: false, message: 'Ingresa el código de 6 dígitos.' }
  const auth = createAuthActions({ cookies: store })
  const verified = await auth.verifyEmail({ email, otp })
  if (verified.error)
    return { ok: false, message: message(verified.error, 'Código inválido o vencido.') }
  const client = createServerClient({ cookies: store })
  const registration = await client.database.rpc('complete_registration', { initial_role: role })
  if (registration.error)
    return { ok: false, message: message(registration.error, 'No pudimos completar tu perfil.') }
  store.delete('medicerca_pending_email')
  store.delete('medicerca_pending_role')
  return {
    ok: true,
    message:
      role === 'DOCTOR'
        ? 'Cuenta verificada. Completa tu perfil profesional.'
        : 'Cuenta verificada. Ya puedes reservar.',
  }
}

export async function resendVerification(
  _previous: ActionState = initial,
  _formData?: FormData,
): Promise<ActionState> {
  const store = await cookies()
  const email = store.get('medicerca_pending_email')?.value
  if (!email) return { ok: false, message: 'La solicitud venció.' }
  const client = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
  })
  const { error } = await client.auth.resendVerificationEmail({ email })
  return error
    ? { ok: false, message: message(error, 'No pudimos reenviar el código.') }
    : { ok: true, message: 'Código reenviado.' }
}

export async function signIn(
  _previous: ActionState = initial,
  formData: FormData,
): Promise<ActionState> {
  const auth = createAuthActions({ cookies: await cookies() })
  const { data, error } = await auth.signInWithPassword({
    email: String(formData.get('email') ?? '')
      .trim()
      .toLowerCase(),
    password: String(formData.get('password') ?? ''),
  })
  if (error || !data?.user)
    return { ok: false, message: message(error, 'Correo o contraseña incorrectos.') }
  return { ok: true, message: 'Sesión iniciada.' }
}

export async function signOut() {
  const auth = createAuthActions({ cookies: await cookies() })
  await auth.signOut()
  redirect('/')
}

export async function sendPasswordReset(
  _previous: ActionState = initial,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const store = await cookies()
  store.set('medicerca_reset_email', email, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  })
  const client = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
  })
  const { error } = await client.auth.sendResetPasswordEmail({ email })
  return error
    ? { ok: false, message: message(error, 'No pudimos enviar el código.') }
    : { ok: true, message: 'Si la cuenta existe, recibirás un código.' }
}

export async function resetPassword(
  _previous: ActionState = initial,
  formData: FormData,
): Promise<ActionState> {
  const email = (await cookies()).get('medicerca_reset_email')?.value
  const code = String(formData.get('code') ?? '').replace(/\D/g, '')
  const password = String(formData.get('password') ?? '')
  const confirmation = String(formData.get('confirmation') ?? '')
  if (!email) return { ok: false, message: 'La solicitud venció.' }
  if (password !== confirmation) return { ok: false, message: 'Las contraseñas no coinciden.' }
  const client = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
  })
  const exchanged = await client.auth.exchangeResetPasswordToken({ email, code })
  if (exchanged.error || !exchanged.data?.token)
    return { ok: false, message: message(exchanged.error, 'Código inválido o vencido.') }
  const reset = await client.auth.resetPassword({
    newPassword: password,
    otp: exchanged.data.token,
  })
  if (reset.error)
    return { ok: false, message: message(reset.error, 'No pudimos cambiar la contraseña.') }
  return { ok: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' }
}
