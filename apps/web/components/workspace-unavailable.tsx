import { RefreshCw, ShieldAlert } from 'lucide-react'

export function WorkspaceUnavailable() {
  return (
    <section className="container-page py-14 sm:py-20">
      <div className="card mx-auto max-w-xl p-7 text-center sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
          <ShieldAlert size={28} />
        </span>
        <h1 className="mt-5 text-3xl font-black">No pudimos verificar tu panel</h1>
        <p className="mt-3 leading-7 text-slate-600">
          Tu sesión no se cerró. Reintenta cuando la conexión se haya restablecido.
        </p>
        <a className="btn-primary mt-7" href="">
          <RefreshCw size={18} /> Reintentar
        </a>
      </div>
    </section>
  )
}
