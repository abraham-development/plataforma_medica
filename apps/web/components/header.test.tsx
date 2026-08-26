import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Header } from './header'

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

function sessionResponse(displayName: string) {
  return {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue({
      authenticated: true,
      role: pathname.startsWith('/medico') ? 'DOCTOR' : 'PATIENT',
      displayName,
    }),
  } as unknown as Response
}

describe('workspace header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn(async () => sessionResponse('Alicia'))
  })

  it('identifies the doctor workspace and exposes its account menu', async () => {
    pathname = '/medico/agenda'
    render(<Header />)

    expect(screen.getAllByText('Panel médico')[0]).toBeVisible()
    expect(screen.getByRole('link', { name: 'Agenda' })).toHaveAttribute('aria-current', 'page')
    const account = await screen.findByRole('button', {
      name: 'Abrir menú de cuenta de Alicia',
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
      expect(screen.getByRole('button', { name: 'Abrir menú de cuenta de Alicia' })).toBeVisible()
    })
    expect(screen.getByRole('link', { name: 'Buscar médicos' })).toBeVisible()
  })

  it('replaces the registration name after the professional profile changes', async () => {
    pathname = '/medico/perfil'
    const fetchMock = jest.mocked(global.fetch)
    fetchMock
      .mockResolvedValueOnce(sessionResponse('Alicia'))
      .mockResolvedValueOnce(sessionResponse('Alicia Torres'))
    render(<Header />)

    expect(
      await screen.findByRole('button', { name: 'Abrir menú de cuenta de Alicia' }),
    ).toBeVisible()
    window.dispatchEvent(new Event('medicerca:profile-changed'))
    expect(
      await screen.findByRole('button', { name: 'Abrir menú de cuenta de Alicia Torres' }),
    ).toBeVisible()
  })
})
