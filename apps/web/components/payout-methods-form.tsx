'use client'

import { useCallback, useEffect, useState } from 'react'
import { Building2, LoaderCircle, Pencil, Plus, Smartphone, Star, Trash2 } from 'lucide-react'
import { authenticatedApiFetch, handleSessionError } from '@/lib/insforge/authenticated-fetch'

type PayoutMethod = {
  id: string
  type: 'YAPE' | 'BANK_ACCOUNT'
  holderName: string
  yapePhone: string | null
  bankName: string | null
  bankAccountType: 'SAVINGS' | 'CHECKING' | null
  bankAccountNumber: string | null
  cci: string | null
  currency: 'PEN'
  preferred: boolean
  createdAt: string
  updatedAt: string
}

const emptyForm = {
  type: 'YAPE' as const,
  holderName: '',
  yapePhone: '',
  bankName: '',
  bankAccountType: 'SAVINGS' as const,
  bankAccountNumber: '',
  cci: '',
  preferred: false,
}

type FormState = Omit<typeof emptyForm, 'type' | 'bankAccountType'> & {
  type: 'YAPE' | 'BANK_ACCOUNT'
  bankAccountType: 'SAVINGS' | 'CHECKING'
}

function digits(value: string) {
  return value.replace(/\D/g, '')
}

function maskPhone(value: string | null) {
  return value ? `*** *** ${value.slice(-3)}` : ''
}

function maskAccount(value: string | null) {
  return value ? `•••• ${value.slice(-4)}` : ''
}

async function responseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => ({}))) as { message?: string | string[] }
  return Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? fallback)
}

export function PayoutMethodsForm() {
  const [items, setItems] = useState<PayoutMethod[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await authenticatedApiFetch('/doctors/me/payout-methods')
      if (!response.ok)
        throw new Error(await responseError(response, 'No pudimos cargar tus métodos.'))
      setItems((await response.json()) as PayoutMethod[])
    } catch (error) {
      if (!handleSessionError(error)) {
        setNotice(error instanceof Error ? error.message : 'No pudimos cargar tus métodos.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function edit(item: PayoutMethod) {
    setEditingId(item.id)
    setForm({
      type: item.type,
      holderName: item.holderName,
      yapePhone: item.yapePhone ?? '',
      bankName: item.bankName ?? '',
      bankAccountType: item.bankAccountType ?? 'SAVINGS',
      bankAccountNumber: item.bankAccountNumber ?? '',
      cci: item.cci ?? '',
      preferred: item.preferred,
    })
    document.getElementById('payout-method-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    const body =
      form.type === 'YAPE'
        ? {
            type: 'YAPE',
            holderName: form.holderName,
            yapePhone: form.yapePhone,
            preferred: form.preferred,
          }
        : {
            type: 'BANK_ACCOUNT',
            holderName: form.holderName,
            bankName: form.bankName,
            bankAccountType: form.bankAccountType,
            bankAccountNumber: form.bankAccountNumber,
            cci: form.cci || undefined,
            preferred: form.preferred,
          }
    try {
      const response = await authenticatedApiFetch(
        editingId ? `/doctors/me/payout-methods/${editingId}` : '/doctors/me/payout-methods',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
      if (!response.ok) throw new Error(await responseError(response, 'No pudimos guardar.'))
      resetForm()
      setNotice(editingId ? 'Método actualizado.' : 'Método agregado.')
      await load()
    } catch (error) {
      if (!handleSessionError(error)) {
        setNotice(error instanceof Error ? error.message : 'No pudimos guardar.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function call(id: string, action: 'preferred' | 'delete') {
    if (action === 'delete' && !window.confirm('¿Eliminar este método de pago?')) return
    setSaving(true)
    setNotice('')
    try {
      const path =
        action === 'preferred'
          ? `/doctors/me/payout-methods/${id}/preferred`
          : `/doctors/me/payout-methods/${id}`
      const response = await authenticatedApiFetch(path, {
        method: action === 'preferred' ? 'POST' : 'DELETE',
      })
      if (!response.ok) {
        throw new Error(
          await responseError(
            response,
            action === 'preferred' ? 'No pudimos cambiar el principal.' : 'No pudimos eliminar.',
          ),
        )
      }
      if (editingId === id) resetForm()
      setNotice(action === 'preferred' ? 'Método principal actualizado.' : 'Método eliminado.')
      await load()
    } catch (error) {
      if (!handleSessionError(error)) {
        setNotice(error instanceof Error ? error.message : 'No pudimos completar la operación.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950 sm:p-5">
        <h2 className="font-black">MediCerca recibe primero el pago del paciente</h2>
        <p className="mt-1">
          Estos datos son únicamente para que la plataforma te transfiera tus ingresos. Nunca debes
          solicitarle al paciente que pague directamente a estas cuentas.
        </p>
      </section>

      {notice && (
        <p role="status" className="rounded-xl bg-cloud p-3 text-sm">
          {notice}
        </p>
      )}

      <section aria-labelledby="saved-payout-methods" className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black" id="saved-payout-methods">
            Tus métodos guardados
          </h2>
          <span className="text-sm text-slate-500">{items.length} registrados</span>
        </div>
        {loading ? (
          <div className="card flex items-center gap-2 p-6 text-slate-600">
            <LoaderCircle className="animate-spin" size={18} /> Cargando métodos…
          </div>
        ) : items.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((item) => (
              <article className="card p-5" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-mint">
                      {item.type === 'YAPE' ? <Smartphone size={21} /> : <Building2 size={21} />}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-black">
                        {item.type === 'YAPE' ? 'Yape' : item.bankName}
                      </h3>
                      <p className="truncate text-sm text-slate-500">{item.holderName}</p>
                    </div>
                  </div>
                  {item.preferred && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                      <Star fill="currentColor" size={13} /> Principal
                    </span>
                  )}
                </div>
                <p className="mt-4 font-mono text-lg font-bold tracking-wide">
                  {item.type === 'YAPE'
                    ? maskPhone(item.yapePhone)
                    : maskAccount(item.bankAccountNumber)}
                </p>
                {item.type === 'BANK_ACCOUNT' && (
                  <p className="mt-1 text-sm text-slate-500">
                    {item.bankAccountType === 'SAVINGS' ? 'Cuenta de ahorros' : 'Cuenta corriente'}{' '}
                    · PEN
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={() => edit(item)} type="button">
                    <Pencil size={16} /> Editar
                  </button>
                  {!item.preferred && (
                    <button
                      className="btn-secondary"
                      disabled={saving}
                      onClick={() => void call(item.id, 'preferred')}
                      type="button"
                    >
                      <Star size={16} /> Usar como principal
                    </button>
                  )}
                  <button
                    className="btn-secondary text-red-700"
                    disabled={saving}
                    onClick={() => void call(item.id, 'delete')}
                    type="button"
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-slate-600">
            <Plus className="mx-auto text-mint" size={34} />
            <p className="mt-3 font-bold">Aún no registraste un destino de pago.</p>
          </div>
        )}
      </section>

      <form className="card grid gap-5 p-4 sm:p-6" id="payout-method-form" onSubmit={save}>
        <div>
          <h2 className="text-xl font-black">
            {editingId ? 'Editar método de pago' : 'Agregar método de pago'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Los datos completos solo se muestran bajo acceso administrativo auditado.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="payout-type">
            Tipo de método
          </label>
          <select
            className="field"
            disabled={saving}
            id="payout-type"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                type: event.target.value as FormState['type'],
              }))
            }
            value={form.type}
          >
            <option value="YAPE">Yape</option>
            <option value="BANK_ACCOUNT">Cuenta bancaria</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="payout-holder">
            Titular del método
          </label>
          <input
            className="field"
            disabled={saving}
            id="payout-holder"
            maxLength={160}
            onChange={(event) =>
              setForm((current) => ({ ...current, holderName: event.target.value }))
            }
            required
            value={form.holderName}
          />
        </div>
        {form.type === 'YAPE' ? (
          <div>
            <label className="label" htmlFor="yape-phone">
              Número de celular Yape
            </label>
            <input
              className="field"
              disabled={saving}
              id="yape-phone"
              inputMode="numeric"
              maxLength={15}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  yapePhone: digits(event.target.value).slice(0, 11),
                }))
              }
              pattern="(?:51)?9[0-9]{8}"
              placeholder="987654321"
              required
              type="tel"
              value={form.yapePhone}
            />
          </div>
        ) : (
          <div className="grid gap-4">
            <div>
              <label className="label" htmlFor="bank-name">
                Banco
              </label>
              <input
                className="field"
                disabled={saving}
                id="bank-name"
                maxLength={100}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bankName: event.target.value }))
                }
                placeholder="Nombre del banco"
                required
                value={form.bankName}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="bank-account-type">
                  Tipo de cuenta
                </label>
                <select
                  className="field"
                  disabled={saving}
                  id="bank-account-type"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bankAccountType: event.target.value as FormState['bankAccountType'],
                    }))
                  }
                  value={form.bankAccountType}
                >
                  <option value="SAVINGS">Ahorros</option>
                  <option value="CHECKING">Corriente</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="bank-currency">
                  Moneda
                </label>
                <input
                  className="field bg-slate-50"
                  id="bank-currency"
                  readOnly
                  value="Soles (PEN)"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="bank-account-number">
                Número de cuenta
              </label>
              <input
                className="field"
                disabled={saving}
                id="bank-account-number"
                inputMode="numeric"
                maxLength={30}
                minLength={6}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bankAccountNumber: digits(event.target.value).slice(0, 30),
                  }))
                }
                required
                value={form.bankAccountNumber}
              />
            </div>
            <div>
              <label className="label" htmlFor="bank-cci">
                CCI <span className="font-normal text-slate-500">(opcional, 20 dígitos)</span>
              </label>
              <input
                className="field"
                disabled={saving}
                id="bank-cci"
                inputMode="numeric"
                maxLength={20}
                minLength={form.cci ? 20 : undefined}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cci: digits(event.target.value).slice(0, 20),
                  }))
                }
                value={form.cci}
              />
            </div>
          </div>
        )}
        <label className="flex min-h-11 items-center gap-3 rounded-xl border p-3 font-bold">
          <input
            checked={form.preferred}
            disabled={saving}
            onChange={(event) =>
              setForm((current) => ({ ...current, preferred: event.target.checked }))
            }
            type="checkbox"
          />
          Usar como método principal
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="btn-primary" disabled={saving || loading}>
            {saving ? <LoaderCircle className="animate-spin" size={18} /> : <Plus size={18} />}
            {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Agregar método'}
          </button>
          {editingId && (
            <button className="btn-secondary" disabled={saving} onClick={resetForm} type="button">
              Cancelar edición
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
