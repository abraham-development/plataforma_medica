'use client'

import { useCallback, useEffect, useState } from 'react'
import { Building2, Clipboard, Eye, LoaderCircle, ShieldCheck, Smartphone, X } from 'lucide-react'
import { authenticatedApiFetch, handleSessionError } from '@/lib/insforge/authenticated-fetch'

type Summary = {
  doctorId: string
  doctorName: string
  verificationStatus: string
  methodCount: number
  preferredType: 'YAPE' | 'BANK_ACCOUNT' | null
  preferredMaskedDestination: string | null
  methodsUpdatedAt: string | null
}

type Method = {
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
}

async function responseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => ({}))) as { message?: string | string[] }
  return Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? fallback)
}

export function AdminPayoutMethods() {
  const [rows, setRows] = useState<Summary[]>([])
  const [revealed, setRevealed] = useState<{ doctor: Summary; methods: Method[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [revealingId, setRevealingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await authenticatedApiFetch('/admin/doctor-payout-methods')
      if (!response.ok)
        throw new Error(await responseError(response, 'No pudimos cargar los destinos.'))
      setRows((await response.json()) as Summary[])
    } catch (error) {
      if (!handleSessionError(error)) {
        setNotice(error instanceof Error ? error.message : 'No pudimos cargar los destinos.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function reveal(doctor: Summary) {
    setRevealingId(doctor.doctorId)
    setNotice('')
    try {
      const response = await authenticatedApiFetch(
        `/admin/doctors/${doctor.doctorId}/payout-methods/reveal`,
        { method: 'POST' },
      )
      if (!response.ok)
        throw new Error(await responseError(response, 'No pudimos revelar los datos.'))
      setRevealed({ doctor, methods: (await response.json()) as Method[] })
    } catch (error) {
      if (!handleSessionError(error)) {
        setNotice(error instanceof Error ? error.message : 'No pudimos revelar los datos.')
      }
    } finally {
      setRevealingId(null)
    }
  }

  function closeReveal() {
    setRevealed(null)
    setCopied('')
  }

  async function copy(label: string, value: string | null) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(label)
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="flex items-center gap-2 font-black">
          <ShieldCheck size={18} /> Acceso a datos financieros personales
        </p>
        <p className="mt-1">
          Los números completos permanecen ocultos. Cada uso de “Ver datos” queda registrado en la
          auditoría administrativa.
        </p>
      </div>
      {notice && (
        <p className="rounded-xl bg-red-50 p-3 text-red-700" role="alert">
          {notice}
        </p>
      )}
      <section className="card overflow-hidden">
        <div className="border-b p-5">
          <h2 className="text-xl font-black">Destinos configurados</h2>
        </div>
        {loading ? (
          <p className="flex items-center gap-2 p-8 text-slate-600">
            <LoaderCircle className="animate-spin" size={18} /> Cargando médicos…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-cloud">
                <tr>
                  <th className="p-4">Médico</th>
                  <th className="p-4">Verificación</th>
                  <th className="p-4">Métodos</th>
                  <th className="p-4">Principal</th>
                  <th className="p-4">Actualización</th>
                  <th className="p-4">Acción</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((doctor) => (
                  <tr className="border-t" key={doctor.doctorId}>
                    <td className="p-4 font-bold">{doctor.doctorName}</td>
                    <td className="p-4">{doctor.verificationStatus}</td>
                    <td className="p-4">{doctor.methodCount}</td>
                    <td className="p-4">{doctor.preferredMaskedDestination ?? 'Sin configurar'}</td>
                    <td className="p-4">
                      {doctor.methodsUpdatedAt
                        ? new Intl.DateTimeFormat('es-PE', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            timeZone: 'America/Lima',
                          }).format(new Date(doctor.methodsUpdatedAt))
                        : '—'}
                    </td>
                    <td className="p-4">
                      <button
                        className="btn-secondary"
                        disabled={!doctor.methodCount || revealingId === doctor.doctorId}
                        onClick={() => void reveal(doctor)}
                        type="button"
                      >
                        {revealingId === doctor.doctorId ? (
                          <LoaderCircle className="animate-spin" size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                        Ver datos
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <p className="p-8 text-center text-slate-500">No hay médicos registrados.</p>
            )}
          </div>
        )}
      </section>

      {revealed && (
        <div
          aria-labelledby="revealed-payout-title"
          aria-modal="true"
          className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-slate-950/55 p-3 sm:p-6"
          role="dialog"
        >
          <section className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black" id="revealed-payout-title">
                  Destinos de {revealed.doctor.doctorName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Esta consulta ya fue registrada en auditoría.
                </p>
              </div>
              <button
                aria-label="Cerrar datos revelados"
                className="rounded-xl p-3 hover:bg-cloud"
                onClick={closeReveal}
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              {revealed.methods.map((method) => (
                <article className="rounded-2xl border p-4" key={method.id}>
                  <div className="flex items-center gap-2 font-black">
                    {method.type === 'YAPE' ? <Smartphone size={19} /> : <Building2 size={19} />}
                    {method.type === 'YAPE' ? 'Yape' : method.bankName}
                    {method.preferred && (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-800">
                        Principal
                      </span>
                    )}
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">Titular</dt>
                      <dd className="font-bold">{method.holderName}</dd>
                    </div>
                    {method.type === 'YAPE' ? (
                      <SensitiveValue
                        label="Celular"
                        value={method.yapePhone}
                        onCopy={copy}
                        copied={copied}
                      />
                    ) : (
                      <>
                        <div>
                          <dt className="text-slate-500">Tipo y moneda</dt>
                          <dd className="font-bold">
                            {method.bankAccountType === 'SAVINGS' ? 'Ahorros' : 'Corriente'} · PEN
                          </dd>
                        </div>
                        <SensitiveValue
                          label="Cuenta"
                          value={method.bankAccountNumber}
                          onCopy={copy}
                          copied={copied}
                        />
                        {method.cci && (
                          <SensitiveValue
                            label="CCI"
                            value={method.cci}
                            onCopy={copy}
                            copied={copied}
                          />
                        )}
                      </>
                    )}
                  </dl>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function SensitiveValue({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string
  value: string | null
  copied: string
  onCopy: (label: string, value: string | null) => Promise<void>
}) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="flex items-center gap-2 font-mono font-bold">
        <span>{value}</span>
        <button
          aria-label={`Copiar ${label.toLowerCase()}`}
          className="rounded-lg p-2 text-ocean hover:bg-cloud"
          onClick={() => void onCopy(label, value)}
          type="button"
        >
          <Clipboard size={15} />
        </button>
        {copied === label && <span className="font-sans text-xs text-mint">Copiado</span>}
      </dd>
    </div>
  )
}
