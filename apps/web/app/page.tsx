import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  HeartPulse,
  House,
  Laptop,
  Search,
  ShieldCheck,
} from 'lucide-react'

export default function HomePage() {
  return (
    <>
      <section className="overflow-hidden bg-gradient-to-br from-cloud via-white to-emerald-50 py-16 sm:py-24">
        <div className="container-page grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-ocean shadow">
              Atención médica en Lima y Callao
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight text-ink sm:text-6xl">
              Tu médico más cerca, estés donde estés.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Encuentra profesionales verificados para una consulta virtual o solicita atención
              médica en tu domicilio.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" href="/medicos">
                <Search size={19} /> Buscar un médico
              </Link>
              <Link className="btn-secondary" href="/registro">
                Crear cuenta <ArrowRight size={18} />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-sm font-semibold text-slate-600">
              <span className="flex items-center gap-2">
                <ShieldCheck className="text-mint" size={19} /> Médicos verificados
              </span>
              <span className="flex items-center gap-2">
                <CalendarCheck className="text-mint" size={19} /> Reserva inmediata
              </span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="card relative z-10 grid gap-5 p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-sky-50 p-4 text-ocean">
                  <Laptop size={30} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Consulta virtual</h2>
                  <p className="text-slate-600">Habla con tu médico desde donde estés.</p>
                </div>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-emerald-50 p-4 text-mint">
                  <House size={30} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Atención a domicilio</h2>
                  <p className="text-slate-600">
                    Elige tu distrito, dirección y referencia al reservar.
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 -right-8 h-36 w-36 rounded-full bg-mint/15" />
            <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-ocean/15" />
          </div>
        </div>
      </section>
      <section id="como-funciona" className="container-page py-20">
        <div className="text-center">
          <p className="font-bold uppercase tracking-widest text-mint">Simple y seguro</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Tu atención en tres pasos</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            [Search, '1. Encuentra', 'Busca por nombre, especialidad o modalidad.'],
            [HeartPulse, '2. Elige', 'Revisa el perfil, la cobertura y los horarios.'],
            [CalendarCheck, '3. Reserva', 'Confirma un horario de 30 minutos al instante.'],
          ].map(([Icon, title, text]) => {
            const C = Icon as typeof Search
            return (
              <article className="card p-7" key={String(title)}>
                <C className="text-mint" size={31} />
                <h3 className="mt-5 text-xl font-bold">{String(title)}</h3>
                <p className="mt-2 text-slate-600">{String(text)}</p>
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}
