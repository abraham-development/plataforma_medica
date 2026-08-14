export type ConsultationMode = 'VIRTUAL' | 'HOME_VISIT'

export type DirectorySpecialty = {
  id: string
  name: string
  slug: string
  description: string
  prompt: string
}

export type PatientReview = {
  author: string
  dateLabel: string
  rating: number
  text: string
}

export type DirectoryDoctor = {
  user_id: string
  first_name: string
  last_name: string
  display_title: string
  registration: string
  cmp: string
  bio: string
  avatar_url: string | null
  offers_virtual: boolean
  offers_home_visit: boolean
  verified: boolean
  demo: boolean
  years_experience: number | null
  rating: number | null
  review_count: number
  next_available_label: string
  doctor_specialties: { specialties: { id: string; name: string; slug: string } }[]
}

export type DemoDoctor = DirectoryDoctor & {
  headline: string
  education: string[]
  languages: string[]
  focus_areas: string[]
  districts: string[]
  reviews: PatientReview[]
  schedule: { dayOffset: number; times: string[]; modes: ConsultationMode[] }[]
}

export const demoSpecialties: DirectorySpecialty[] = [
  {
    id: 'demo-specialty-pediatria',
    name: 'Pediatría',
    slug: 'pediatria',
    description: 'Cuidado integral para bebés, niñas, niños y adolescentes.',
    prompt: 'Crecimiento, controles, alimentación y enfermedades frecuentes.',
  },
  {
    id: 'demo-specialty-psicologia',
    name: 'Psicología',
    slug: 'psicologia',
    description: 'Acompañamiento emocional para afrontar cambios y recuperar bienestar.',
    prompt: 'Ansiedad, estrés, vínculos, duelo y desarrollo personal.',
  },
]

const pediatricSpecialty = {
  id: 'demo-specialty-pediatria',
  name: 'Pediatría',
  slug: 'pediatria',
}

const psychologySpecialty = {
  id: 'demo-specialty-psicologia',
  name: 'Psicología',
  slug: 'psicologia',
}

export const demoDoctors: DemoDoctor[] = [
  {
    user_id: 'demo-alejandro-rios',
    first_name: 'Alejandro',
    last_name: 'Ríos',
    display_title: 'Dr.',
    registration: 'CMP de muestra 10421',
    cmp: 'DEMO-10421',
    headline: 'Pediatra enfocado en acompañar a las familias con explicaciones claras y cercanas.',
    bio: 'Atiende controles de crecimiento, enfermedades respiratorias frecuentes y orientación para madres y padres. Su enfoque combina prevención, escucha y decisiones compartidas con la familia.',
    avatar_url: '/doctors/alejandro-rios.png',
    offers_virtual: true,
    offers_home_visit: true,
    verified: true,
    demo: true,
    years_experience: 12,
    rating: 4.9,
    review_count: 128,
    next_available_label: 'Disponible mañana',
    doctor_specialties: [{ specialties: pediatricSpecialty }],
    education: [
      'Especialidad de Pediatría — perfil demostrativo',
      'Formación continua en crecimiento y desarrollo infantil',
    ],
    languages: ['Español', 'Inglés'],
    focus_areas: ['Control del niño sano', 'Salud respiratoria', 'Nutrición infantil'],
    districts: ['Miraflores', 'San Borja', 'Santiago de Surco'],
    reviews: [
      {
        author: 'Mariana P.',
        dateLabel: 'Hace 2 semanas',
        rating: 5,
        text: 'Nos explicó todo con mucha paciencia y mi hijo se sintió tranquilo durante la consulta.',
      },
      {
        author: 'Carlos T.',
        dateLabel: 'Hace 1 mes',
        rating: 5,
        text: 'Puntual, claro y muy atento con nuestras dudas como padres primerizos.',
      },
    ],
    schedule: [
      { dayOffset: 1, times: ['09:00', '10:30', '16:00'], modes: ['VIRTUAL', 'HOME_VISIT'] },
      { dayOffset: 2, times: ['08:30', '11:00', '17:30'], modes: ['VIRTUAL'] },
      { dayOffset: 4, times: ['09:30', '15:00'], modes: ['VIRTUAL', 'HOME_VISIT'] },
    ],
  },
  {
    user_id: 'demo-veronica-salazar',
    first_name: 'Verónica',
    last_name: 'Salazar',
    display_title: 'Dra.',
    registration: 'CMP de muestra 18754',
    cmp: 'DEMO-18754',
    headline: 'Pediatra con especial interés en primera infancia, lactancia y prevención.',
    bio: 'Acompaña a las familias durante los primeros años de vida con un enfoque preventivo y respetuoso. Brinda orientación práctica para resolver dudas de alimentación, sueño y desarrollo.',
    avatar_url: '/doctors/veronica-salazar.png',
    offers_virtual: true,
    offers_home_visit: true,
    verified: true,
    demo: true,
    years_experience: 15,
    rating: 4.8,
    review_count: 96,
    next_available_label: 'Disponible hoy',
    doctor_specialties: [{ specialties: pediatricSpecialty }],
    education: [
      'Especialidad de Pediatría — perfil demostrativo',
      'Actualización en lactancia y nutrición durante la primera infancia',
    ],
    languages: ['Español'],
    focus_areas: ['Primera infancia', 'Lactancia', 'Desarrollo y sueño'],
    districts: ['Jesús María', 'Magdalena del Mar', 'San Miguel'],
    reviews: [
      {
        author: 'Andrea L.',
        dateLabel: 'Hace 8 días',
        rating: 5,
        text: 'Fue muy empática y salimos con indicaciones fáciles de seguir en casa.',
      },
      {
        author: 'Renzo G.',
        dateLabel: 'Hace 3 semanas',
        rating: 4,
        text: 'Buena atención y excelente seguimiento después de la consulta.',
      },
    ],
    schedule: [
      { dayOffset: 0, times: ['17:00', '18:00'], modes: ['VIRTUAL'] },
      { dayOffset: 2, times: ['09:00', '10:00', '15:30'], modes: ['VIRTUAL', 'HOME_VISIT'] },
      { dayOffset: 3, times: ['11:30', '16:30'], modes: ['VIRTUAL', 'HOME_VISIT'] },
    ],
  },
  {
    user_id: 'demo-camila-torres',
    first_name: 'Camila',
    last_name: 'Torres',
    display_title: 'Dra.',
    registration: 'CMP de muestra 26380',
    cmp: 'DEMO-26380',
    headline: 'Pediatra que promueve consultas amables, sencillas y adaptadas a cada etapa.',
    bio: 'Trabaja con familias que buscan acompañamiento en crecimiento, alimentación y salud preventiva. Prioriza una comunicación comprensible para que cada indicación tenga sentido.',
    avatar_url: '/doctors/camila-torres.png',
    offers_virtual: true,
    offers_home_visit: false,
    verified: true,
    demo: true,
    years_experience: 9,
    rating: 5,
    review_count: 74,
    next_available_label: 'Disponible en 2 días',
    doctor_specialties: [{ specialties: pediatricSpecialty }],
    education: [
      'Especialidad de Pediatría — perfil demostrativo',
      'Capacitación en prevención y hábitos saludables en edad escolar',
    ],
    languages: ['Español', 'Portugués'],
    focus_areas: ['Edad escolar', 'Prevención', 'Hábitos saludables'],
    districts: [],
    reviews: [
      {
        author: 'Valeria S.',
        dateLabel: 'Hace 5 días',
        rating: 5,
        text: 'Mi hija conectó rápidamente con ella. La consulta virtual fue muy ordenada.',
      },
      {
        author: 'José M.',
        dateLabel: 'Hace 1 mes',
        rating: 5,
        text: 'Nos dio recomendaciones concretas y respondió todas nuestras preguntas.',
      },
    ],
    schedule: [
      { dayOffset: 2, times: ['08:00', '09:00', '13:00'], modes: ['VIRTUAL'] },
      { dayOffset: 3, times: ['10:30', '17:00'], modes: ['VIRTUAL'] },
      { dayOffset: 5, times: ['09:30', '11:00', '12:30'], modes: ['VIRTUAL'] },
    ],
  },
  {
    user_id: 'demo-paola-mendoza',
    first_name: 'Paola',
    last_name: 'Mendoza',
    display_title: 'Ps.',
    registration: 'C.Ps.P. de muestra 48291',
    cmp: 'DEMO-48291',
    headline: 'Psicóloga clínica para procesos de ansiedad, estrés y cambios importantes.',
    bio: 'Ofrece un espacio de escucha sin juicios y herramientas prácticas para comprender emociones, fortalecer recursos personales y avanzar con objetivos alcanzables.',
    avatar_url: '/doctors/paola-mendoza.png',
    offers_virtual: true,
    offers_home_visit: false,
    verified: true,
    demo: true,
    years_experience: 11,
    rating: 4.9,
    review_count: 112,
    next_available_label: 'Disponible mañana',
    doctor_specialties: [{ specialties: psychologySpecialty }],
    education: [
      'Psicología clínica — perfil demostrativo',
      'Formación continua en terapia cognitivo-conductual',
    ],
    languages: ['Español', 'Inglés'],
    focus_areas: ['Ansiedad', 'Estrés laboral', 'Autoestima'],
    districts: [],
    reviews: [
      {
        author: 'Paciente verificado',
        dateLabel: 'Hace 1 semana',
        rating: 5,
        text: 'Me sentí escuchada desde la primera sesión y las herramientas fueron muy útiles.',
      },
      {
        author: 'Paciente verificado',
        dateLabel: 'Hace 1 mes',
        rating: 5,
        text: 'Un espacio seguro, profesional y con objetivos claros para cada sesión.',
      },
    ],
    schedule: [
      { dayOffset: 1, times: ['08:30', '12:00', '19:00'], modes: ['VIRTUAL'] },
      { dayOffset: 3, times: ['10:00', '16:00', '18:30'], modes: ['VIRTUAL'] },
      { dayOffset: 4, times: ['09:00', '17:00'], modes: ['VIRTUAL'] },
    ],
  },
  {
    user_id: 'demo-jorge-vargas',
    first_name: 'Jorge',
    last_name: 'Vargas',
    display_title: 'Ps.',
    registration: 'C.Ps.P. de muestra 35106',
    cmp: 'DEMO-35106',
    headline: 'Psicólogo clínico con enfoque práctico para adultos, parejas y familias.',
    bio: 'Acompaña procesos relacionados con comunicación, vínculos y transiciones de vida. Su trabajo busca convertir la reflexión en acuerdos y cambios sostenibles.',
    avatar_url: '/doctors/jorge-vargas.png',
    offers_virtual: true,
    offers_home_visit: true,
    verified: true,
    demo: true,
    years_experience: 17,
    rating: 4.8,
    review_count: 89,
    next_available_label: 'Disponible en 2 días',
    doctor_specialties: [{ specialties: psychologySpecialty }],
    education: [
      'Psicología clínica — perfil demostrativo',
      'Especialización demostrativa en terapia familiar sistémica',
    ],
    languages: ['Español'],
    focus_areas: ['Relaciones de pareja', 'Familia', 'Cambios de vida'],
    districts: ['La Molina', 'San Borja', 'Santiago de Surco'],
    reviews: [
      {
        author: 'Paciente verificado',
        dateLabel: 'Hace 3 semanas',
        rating: 5,
        text: 'Nos ayudó a conversar de una manera distinta y a construir acuerdos concretos.',
      },
      {
        author: 'Paciente verificado',
        dateLabel: 'Hace 2 meses',
        rating: 4,
        text: 'Muy profesional y directo, manteniendo siempre un trato respetuoso.',
      },
    ],
    schedule: [
      { dayOffset: 2, times: ['09:00', '14:00', '18:00'], modes: ['VIRTUAL', 'HOME_VISIT'] },
      { dayOffset: 4, times: ['10:30', '16:30'], modes: ['VIRTUAL'] },
      { dayOffset: 6, times: ['09:30', '11:30'], modes: ['VIRTUAL', 'HOME_VISIT'] },
    ],
  },
  {
    user_id: 'demo-lucia-fernandez',
    first_name: 'Lucía',
    last_name: 'Fernández',
    display_title: 'Ps.',
    registration: 'C.Ps.P. de muestra 52714',
    cmp: 'DEMO-52714',
    headline: 'Psicóloga enfocada en bienestar emocional, duelo y desarrollo personal.',
    bio: 'Brinda acompañamiento cercano para personas que atraviesan pérdidas, decisiones complejas o etapas de cambio. Integra escucha, psicoeducación y ejercicios entre sesiones.',
    avatar_url: '/doctors/lucia-fernandez.png',
    offers_virtual: true,
    offers_home_visit: false,
    verified: true,
    demo: true,
    years_experience: 8,
    rating: 4.9,
    review_count: 61,
    next_available_label: 'Disponible hoy',
    doctor_specialties: [{ specialties: psychologySpecialty }],
    education: [
      'Psicología clínica — perfil demostrativo',
      'Formación demostrativa en acompañamiento de duelo y pérdidas',
    ],
    languages: ['Español'],
    focus_areas: ['Duelo', 'Desarrollo personal', 'Regulación emocional'],
    districts: [],
    reviews: [
      {
        author: 'Paciente verificado',
        dateLabel: 'Hace 10 días',
        rating: 5,
        text: 'Su forma de escuchar me ayudó a ordenar lo que estaba sintiendo sin presión.',
      },
      {
        author: 'Paciente verificado',
        dateLabel: 'Hace 6 semanas',
        rating: 5,
        text: 'Cálida y muy clara al explicar el proceso y los siguientes pasos.',
      },
    ],
    schedule: [
      { dayOffset: 0, times: ['18:00', '19:00'], modes: ['VIRTUAL'] },
      { dayOffset: 1, times: ['11:00', '15:00', '17:30'], modes: ['VIRTUAL'] },
      { dayOffset: 3, times: ['09:30', '13:30'], modes: ['VIRTUAL'] },
    ],
  },
]

export function getDemoDoctor(id: string) {
  return demoDoctors.find((doctor) => doctor.user_id === id)
}

export function getDemoAvailableSlots(doctor: DemoDoctor, startDateKey: string) {
  const [year, month, day] = startDateKey.split('-').map(Number)

  return doctor.schedule.flatMap((block) => {
    const date = new Date(year, month - 1, day, 12)
    date.setDate(date.getDate() + block.dayOffset)
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`

    return block.modes.flatMap((consultationMode) =>
      block.times.map((time) => ({
        startsAt: `${dateKey}T${time}:00-05:00`,
        consultationMode,
      })),
    )
  })
}
