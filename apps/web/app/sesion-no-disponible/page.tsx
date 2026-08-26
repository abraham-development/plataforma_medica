import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

function safeNext(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value
  return candidate?.startsWith('/') && !candidate.startsWith('//') ? candidate : '/panel'
}

export default async function SessionUnavailablePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const params = await searchParams
  return (
    <section className="container-page py-14 sm:py-20">
      <div className="card mx-auto max-w-xl p-7 text-center sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
          <ShieldAlert size={28} />
        </span>
        <h1 className="mt-5 text-3xl font-black">Tu sesión sigue protegida</h1>
        <p className="mt-3 leading-7 text-slate-600">
          No pudimos verificarla por un problema temporal. No cerramos tu cuenta ni eliminamos tu
          sesión.
        </p>
        <Link className="btn-primary mt-7" href={safeNext(params.next)}>
          Reintentar
        </Link>
      </div>
    </section>
  )
}
