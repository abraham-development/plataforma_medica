'use client'
import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LoaderCircle, MailCheck } from 'lucide-react'
import {
  resendVerification,
  resetPassword,
  sendPasswordReset,
  signIn,
  signUp,
  verifyRegistration,
  type ActionState,
} from '@/app/actions/auth'

const initial: ActionState = { ok: false, message: '' }
function Notice({ state }: { state: ActionState }) {
  return state.message ? (
    <p
      role="status"
      className={`rounded-xl p-3 text-sm ${state.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}
    >
      {state.message}
    </p>
  ) : null
}
function PasswordField({ name, label }: { name: string; label: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <div className="relative">
        <input
          className="field !pr-12"
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={name === 'password' ? 'new-password' : 'new-password'}
          required
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-3 text-slate-500"
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  )
}
function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button className="btn-primary w-full" disabled={pending}>
      {pending && <LoaderCircle className="animate-spin" size={18} />} {children}
    </button>
  )
}

export function RegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [state, action, pending] = useActionState(signUp, initial)
  const [verifyState, verifyAction, verifying] = useActionState(verifyRegistration, initial)
  const [resendState, resendAction, resending] = useActionState(resendVerification, initial)
  useEffect(() => {
    if (state.ok) setStep('otp')
  }, [state.ok])
  useEffect(() => {
    if (verifyState.ok) {
      window.dispatchEvent(new Event('medicerca:auth-changed'))
      const timeout = setTimeout(() => router.push('/panel'), 900)
      return () => clearTimeout(timeout)
    }
  }, [verifyState.ok, router])
  if (step === 'otp')
    return (
      <div className="grid gap-5">
        <form action={verifyAction} className="grid gap-5">
          <div className="mx-auto rounded-full bg-emerald-50 p-4 text-mint">
            <MailCheck size={36} />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">Verifica tu correo</h2>
            <p className="mt-2 text-slate-600">
              Ingresa el código de 6 dígitos que acabamos de enviarte.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="otp">
              Código de verificación
            </label>
            <input
              id="otp"
              name="otp"
              className="field text-center text-2xl tracking-[.45em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          </div>
          <Notice state={verifyState} />
          <Submit pending={verifying}>Confirmar y entrar</Submit>
        </form>
        <form action={resendAction}>
          <button
            className="w-full text-sm font-bold text-ocean"
            disabled={resending}
            type="submit"
          >
            {resending ? 'Reenviando…' : 'Reenviar código'}
          </button>
          <Notice state={resendState} />
        </form>
      </div>
    )
  return (
    <form action={action} className="grid gap-5">
      <div>
        <label className="label" htmlFor="name">
          Nombre de usuario
        </label>
        <input
          className="field"
          id="name"
          name="name"
          autoComplete="nickname"
          maxLength={100}
          required
          placeholder="¿Cómo te llamamos?"
        />
        <p className="mt-1 text-xs text-slate-500">Completarás nombres y apellidos en tu perfil.</p>
      </div>
      <div>
        <label className="label" htmlFor="email">
          Correo electrónico
        </label>
        <input
          className="field"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@correo.com"
        />
      </div>
      <PasswordField name="password" label="Contraseña" />
      <PasswordField name="confirmation" label="Confirmar contraseña" />
      <fieldset>
        <legend className="label">Quiero usar MediCerca como</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="cursor-pointer rounded-xl border p-4 has-[:checked]:border-mint has-[:checked]:bg-emerald-50">
            <input type="radio" name="role" value="PATIENT" defaultChecked />{' '}
            <span className="ml-2 font-bold">Paciente</span>
          </label>
          <label className="cursor-pointer rounded-xl border p-4 has-[:checked]:border-mint has-[:checked]:bg-emerald-50">
            <input type="radio" name="role" value="DOCTOR" />{' '}
            <span className="ml-2 font-bold">Médico</span>
          </label>
        </div>
      </fieldset>
      <p className="text-xs text-slate-500">
        Mínimo 8 caracteres con mayúscula, minúscula y número.
      </p>
      <Notice state={state} />
      <Submit pending={pending}>Crear mi cuenta</Submit>
    </form>
  )
}

export function LoginForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState(signIn, initial)
  useEffect(() => {
    if (state.ok) {
      window.dispatchEvent(new Event('medicerca:auth-changed'))
      router.push('/panel')
    }
  }, [state.ok, router])
  return (
    <form action={action} className="grid gap-5">
      <div>
        <label className="label" htmlFor="email">
          Correo electrónico
        </label>
        <input
          className="field"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Contraseña
        </label>
        <input
          className="field"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <Notice state={state} />
      <Submit pending={pending}>Iniciar sesión</Submit>
    </form>
  )
}

export function ResetForm() {
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [sendState, sendAction, sending] = useActionState(sendPasswordReset, initial)
  const [state, action, pending] = useActionState(resetPassword, initial)
  useEffect(() => {
    if (sendState.ok) setStep('reset')
  }, [sendState.ok])
  if (step === 'email')
    return (
      <form action={sendAction} className="grid gap-5">
        <div>
          <label className="label" htmlFor="email">
            Correo electrónico
          </label>
          <input className="field" id="email" name="email" type="email" required />
        </div>
        <Notice state={sendState} />
        <Submit pending={sending}>Enviar código</Submit>
      </form>
    )
  return (
    <form action={action} className="grid gap-5">
      <div>
        <label className="label" htmlFor="code">
          Código recibido
        </label>
        <input
          className="field text-center tracking-[.35em]"
          id="code"
          name="code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          required
        />
      </div>
      <PasswordField name="password" label="Nueva contraseña" />
      <PasswordField name="confirmation" label="Confirmar contraseña" />
      <Notice state={state} />
      <Submit pending={pending}>Cambiar contraseña</Submit>
    </form>
  )
}
