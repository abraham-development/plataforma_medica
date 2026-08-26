export default function PageLoading() {
  return (
    <section
      className="container-page py-8 sm:py-12"
      aria-label="Cargando contenido"
      aria-live="polite"
    >
      <div className="animate-pulse">
        <div className="h-5 w-40 rounded-full bg-emerald-100" />
        <div className="mt-5 h-9 w-full max-w-xl rounded-xl bg-slate-200 sm:h-12" />
        <div className="mt-3 h-5 w-full max-w-2xl rounded-lg bg-slate-100" />
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="card overflow-hidden" key={index}>
              <div className="h-44 bg-slate-100" />
              <div className="grid gap-3 p-5">
                <div className="h-5 w-2/3 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-5/6 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Cargando…</span>
    </section>
  )
}
