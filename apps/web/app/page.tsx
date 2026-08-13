import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  ChevronRight,
  Clock3,
  HeartHandshake,
  HeartPulse,
  House,
  Laptop,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'

const trustPoints = [
  { icon: BadgeCheck, label: 'Perfiles médicos verificados' },
  { icon: MapPin, label: 'Todos los distritos de Lima Metropolitana' },
  { icon: CalendarCheck, label: 'Horarios publicados por cada médico' },
]

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Encuentra al profesional indicado',
    text: 'Busca por especialidad, modalidad o nombre y conoce el perfil de cada médico.',
  },
  {
    icon: Clock3,
    number: '02',
    title: 'Elige un horario disponible',
    text: 'Consulta su disponibilidad real y selecciona el momento que mejor encaje contigo.',
  },
  {
    icon: HeartPulse,
    number: '03',
    title: 'Recibe atención con confianza',
    text: 'Confirma tu cita virtual o a domicilio y gestiona todo desde un solo lugar.',
  },
]

const principles = [
  {
    icon: HeartHandshake,
    title: 'El lado humano primero',
    text: 'La tecnología debe acortar distancias, no reemplazar la cercanía entre médico y paciente.',
  },
  {
    icon: ShieldCheck,
    title: 'Confianza desde el inicio',
    text: 'Perfiles profesionales claros para que cada paciente pueda tomar una decisión informada.',
  },
  {
    icon: UserRoundCheck,
    title: 'Atención que se adapta',
    text: 'Dos formas de atenderse para responder a diferentes necesidades y momentos de vida.',
  },
]

export default function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-slate-100 bg-[#f7fbfb]">
        <div className="absolute -left-32 top-24 -z-10 h-80 w-80 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="absolute -right-28 bottom-0 -z-10 h-96 w-96 rounded-full bg-emerald-100/80 blur-3xl" />
        <div className="container-page grid min-h-[680px] items-center gap-14 py-16 lg:grid-cols-[1.08fr_.92fr] lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-bold text-mint shadow-sm">
              <MapPin size={16} /> Operando en Lima Metropolitana
            </span>
            <h1 className="mt-7 max-w-3xl text-balance text-4xl font-black leading-[1.08] tracking-[-0.035em] text-ink sm:text-6xl lg:text-[4.25rem]">
              Atención médica cercana, humana y confiable.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Conectamos pacientes con médicos verificados para recibir una consulta virtual o
              atención a domicilio, con la libertad de elegir cómo y cuándo atenderse.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary min-h-12 px-6" href="/medicos">
                <Search size={19} /> Encontrar un médico
              </Link>
              <Link className="btn-secondary min-h-12 px-6" href="/#como-funciona">
                Conocer cómo funciona <ArrowRight size={18} />
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Check className="rounded-full bg-emerald-100 p-0.5 text-mint" size={19} />
              Tú eliges al profesional, la modalidad y el horario.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[520px] lg:justify-self-end">
            <div className="absolute -left-5 -top-5 h-24 w-24 rounded-3xl border border-white/80 bg-white/50 backdrop-blur" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-5 shadow-[0_30px_90px_rgba(21,107,133,.16)] sm:p-7">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.18em] text-mint">
                    Tu próxima atención
                  </p>
                  <h2 className="mt-2 text-xl font-black text-ink">Elige cómo cuidarte hoy</h2>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cloud text-ocean">
                  <Stethoscope size={25} />
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-ocean shadow-sm">
                    <Laptop size={23} />
                  </span>
                  <h3 className="mt-5 font-black">Consulta virtual</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Desde donde estés.</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-mint shadow-sm">
                    <House size={23} />
                  </span>
                  <h3 className="mt-5 font-black">A domicilio</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">El médico va hacia ti.</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-mint">
                      <CalendarCheck size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-bold">Disponibilidad real</p>
                      <p className="text-xs text-slate-500">Publicada por cada profesional</p>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-400" size={20} />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-ink px-5 py-4 text-white">
                <BadgeCheck className="shrink-0 text-emerald-300" size={23} />
                <p className="text-sm font-semibold">Profesionales con identidad y perfil verificados</p>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-5 -z-10 h-40 w-40 rounded-full bg-mint/20 blur-2xl" />
          </div>
        </div>
      </section>

      <section aria-label="Razones para confiar" className="border-b border-slate-100 bg-white">
        <div className="container-page grid gap-0 py-4 md:grid-cols-3 md:py-0">
          {trustPoints.map(({ icon: Icon, label }, index) => (
            <div
              className={`flex items-center gap-3 py-4 md:px-7 md:py-6 ${
                index > 0 ? 'md:border-l md:border-slate-100' : ''
              }`}
              key={label}
            >
              <Icon className="shrink-0 text-mint" size={22} />
              <span className="text-sm font-bold text-slate-700">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-20 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-ink p-8 text-white sm:p-11">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border-[38px] border-white/5" />
            <Sparkles className="text-emerald-300" size={30} />
            <p className="mt-8 text-sm font-black uppercase tracking-[.2em] text-emerald-300">
              Nuestro propósito
            </p>
            <blockquote className="mt-4 text-balance text-3xl font-black leading-tight sm:text-4xl">
              Todas las personas merecen una atención médica de calidad.
            </blockquote>
            <p className="mt-6 max-w-lg leading-7 text-slate-300">
              Por eso acercamos profesionales y pacientes con una experiencia sencilla, clara y
              pensada para las personas.
            </p>
          </div>

          <div>
            <p className="font-black uppercase tracking-[.18em] text-mint">Más que una reserva</p>
            <h2 className="mt-4 max-w-2xl text-balance text-3xl font-black leading-tight sm:text-5xl">
              Tecnología que acerca la salud sin perder el trato humano.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              MediCerca nace para reducir la distancia entre necesitar atención y encontrar a un
              profesional disponible. La plataforma facilita el encuentro; la relación humana sigue
              siendo el centro.
            </p>
            <div className="mt-9 grid gap-5 sm:grid-cols-3">
              {principles.map(({ icon: Icon, title, text }) => (
                <article key={title}>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-mint">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-4 font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cloud py-20 sm:py-28">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-black uppercase tracking-[.18em] text-mint">Dos formas de atenderte</p>
            <h2 className="mt-4 text-balance text-3xl font-black sm:text-5xl">
              La atención se adapta a tu realidad.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Elige la modalidad que mejor responda a lo que necesitas hoy.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <article className="group overflow-hidden rounded-[2rem] border border-sky-100 bg-white p-7 shadow-sm sm:p-10">
              <div className="flex items-start justify-between gap-5">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-50 text-ocean">
                  <Laptop size={28} />
                </span>
                <span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-ocean">
                  Desde cualquier lugar
                </span>
              </div>
              <h3 className="mt-8 text-2xl font-black">Consulta virtual</h3>
              <p className="mt-3 max-w-xl leading-7 text-slate-600">
                Conversa con un médico sin traslados y recibe orientación profesional desde un
                espacio cómodo para ti.
              </p>
              <ul className="mt-7 grid gap-3 text-sm font-semibold text-slate-700">
                <li className="flex items-center gap-2"><Check className="text-ocean" size={18} /> Evita desplazamientos innecesarios</li>
                <li className="flex items-center gap-2"><Check className="text-ocean" size={18} /> Elige entre horarios disponibles</li>
              </ul>
            </article>

            <article className="group overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-7 shadow-sm sm:p-10">
              <div className="flex items-start justify-between gap-5">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-mint">
                  <House size={28} />
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-mint">
                  En la comodidad de tu hogar
                </span>
              </div>
              <h3 className="mt-8 text-2xl font-black">Atención a domicilio</h3>
              <p className="mt-3 max-w-xl leading-7 text-slate-600">
                Solicita que un profesional vaya hacia ti cuando movilizarte no sea la mejor opción
                para tu bienestar.
              </p>
              <ul className="mt-7 grid gap-3 text-sm font-semibold text-slate-700">
                <li className="flex items-center gap-2"><Check className="text-mint" size={18} /> Indica tu distrito y dirección</li>
                <li className="flex items-center gap-2"><Check className="text-mint" size={18} /> Revisa la cobertura del profesional</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="container-page py-20 sm:py-28">
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-7 sm:p-12 lg:p-16">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_.8fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-mint shadow-sm">
                <MapPin size={17} /> Nuestra primera zona de operación
              </span>
              <h2 className="mt-6 max-w-2xl text-balance text-3xl font-black sm:text-5xl">
                Presentes en Lima Metropolitana, distrito a distrito.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Empezamos cerca: conectando pacientes y profesionales en todos los distritos de Lima
                Metropolitana, con una experiencia diseñada para responder a la dinámica de la ciudad.
              </p>
              <Link className="mt-8 inline-flex items-center gap-2 font-black text-ocean" href="/medicos">
                Ver médicos disponibles <ArrowRight size={18} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['Lima Norte', 'Lima Centro', 'Lima Este', 'Lima Sur'].map((zone, index) => (
                <div
                  className={`rounded-2xl border border-white bg-white/80 p-5 shadow-sm ${
                    index === 0 || index === 3 ? 'sm:translate-y-3' : ''
                  }`}
                  key={zone}
                >
                  <MapPin className="text-mint" size={20} />
                  <p className="mt-3 font-black">{zone}</p>
                  <p className="mt-1 text-xs text-slate-500">Cobertura metropolitana</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-36 bg-ink py-20 text-white sm:py-28">
        <div className="container-page">
          <div className="max-w-3xl">
            <p className="font-black uppercase tracking-[.18em] text-emerald-300">Simple y transparente</p>
            <h2 className="mt-4 text-balance text-3xl font-black sm:text-5xl">
              De buscar atención a tener una cita, en tres pasos.
            </h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map(({ icon: Icon, number, title, text }) => (
              <article className="rounded-[1.75rem] border border-white/10 bg-white/[.06] p-7" key={number}>
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-emerald-300">
                    <Icon size={24} />
                  </span>
                  <span className="text-3xl font-black text-white/15">{number}</span>
                </div>
                <h3 className="mt-8 text-xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-slate-300">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-20 sm:py-28">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-8 sm:p-10">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-mint">
              <UsersRound size={24} />
            </span>
            <p className="mt-7 text-sm font-black uppercase tracking-[.16em] text-mint">Para pacientes</p>
            <h2 className="mt-3 text-3xl font-black">Más claridad para elegir tu atención.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Explora profesionales, conoce sus modalidades y reserva basándote en disponibilidad real.
            </p>
            <Link className="mt-7 inline-flex items-center gap-2 font-black text-ocean" href="/medicos">
              Buscar atención <ArrowRight size={18} />
            </Link>
          </article>
          <article className="rounded-[2rem] border border-slate-200 bg-white p-8 sm:p-10">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-ocean">
              <Stethoscope size={24} />
            </span>
            <p className="mt-7 text-sm font-black uppercase tracking-[.16em] text-ocean">Para médicos</p>
            <h2 className="mt-3 text-3xl font-black">Una forma simple de acercarte a más pacientes.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Presenta tu perfil profesional, define tu disponibilidad y organiza tus próximas atenciones.
            </p>
            <Link className="mt-7 inline-flex items-center gap-2 font-black text-ocean" href="/registro">
              Unirme como médico <ArrowRight size={18} />
            </Link>
          </article>
        </div>
      </section>

      <section className="container-page pb-6 sm:pb-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-mint px-7 py-14 text-center text-white sm:px-12 sm:py-16">
          <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full border-[42px] border-white/10" />
          <div className="absolute -bottom-24 -right-12 h-64 w-64 rounded-full bg-ink/10" />
          <div className="relative mx-auto max-w-3xl">
            <p className="font-black uppercase tracking-[.18em] text-emerald-100">Tu bienestar merece cercanía</p>
            <h2 className="mt-4 text-balance text-3xl font-black sm:text-5xl">
              Encuentra una atención que se adapte a ti.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-emerald-50">
              Da el primer paso hacia una experiencia médica más simple, humana y accesible.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link className="btn-secondary min-h-12 border-white bg-white px-6" href="/medicos">
                Buscar un médico <ArrowRight size={18} />
              </Link>
              <Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 px-6 font-bold text-white hover:bg-white/10" href="/registro">
                Crear mi cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
