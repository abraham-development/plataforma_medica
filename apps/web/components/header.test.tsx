import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Header } from './header'
import { insforge } from '@/lib/insforge/client'

let pathname = '/medico'
const replace = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace }),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => <img {...props} />,
}))

jest.mock('@/app/actions/auth', () => ({ signOut: jest.fn() }))

function queryResult<T>(data: T) {
  const result = { data, error: null }
  return {
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  }
}

jest.mock('@/lib/insforge/client', () => ({
  insforge: {
    auth: { getCurrentUser: jest.fn() },
    database: {
      from: jest.fn((table: string) => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => {
            if (table === 'user_roles') {
              return queryResult(
                pathname.startsWith('/medico') ? [{ role: 'DOCTOR' }] : [{ role: 'PATIENT' }],
              )
            }
            if (table === 'users') return queryResult({ display_name: 'Nombre registrado' })
            return queryResult({ first_name: 'Andrea', last_name: 'Salazar' })
          }),
        })),
      })),
    },
  },
}))

const getCurrentUser = jest.mocked(insforge.auth.getCurrentUser)

describe('workspace header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_INSFORGE_URL = 'https://project.example.test'
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY = 'anon-key'
    getCurrentUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null } as never)
  })

  it('identifies the doctor workspace and exposes its account menu', async () => {
    pathname = '/medico/agenda'
    render(<Header />)

    expect(screen.getAllByText('Panel médico')[0]).toBeVisible()
    expect(screen.getByRole('link', { name: 'Agenda' })).toHaveAttribute('aria-current', 'page')
    const account = await screen.findByRole('button', {
      name: 'Abrir menú de cuenta de Andrea Salazar',
    })
    fireEvent.click(account)
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute(
      'href',
      '/medico/perfil',
    )
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible()
  })

  it('identifies the patient workspace with patient navigation', async () => {
    pathname = '/paciente/citas'
    render(<Header />)

    expect(screen.getAllByText('Panel del paciente')[0]).toBeVisible()
    expect(screen.getByRole('link', { name: 'Mis citas' })).toHaveAttribute('aria-current', 'page')
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Abrir menú de cuenta de Andrea Salazar' }),
      ).toBeVisible()
    })
    expect(screen.getByRole('link', { name: 'Buscar médicos' })).toBeVisible()
  })
})
