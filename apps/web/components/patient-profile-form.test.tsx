import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PatientProfileForm } from './patient-profile-form'
import { authenticatedApiFetch } from '@/lib/insforge/authenticated-fetch'

jest.mock('@/lib/insforge/authenticated-fetch', () => ({
  authenticatedApiFetch: jest.fn(),
  handleSessionError: jest.fn(() => false),
}))

const apiFetch = jest.mocked(authenticatedApiFetch)

function response(body: unknown, ok = true) {
  return { ok, json: jest.fn().mockResolvedValue(body) } as unknown as Response
}

describe('PatientProfileForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    apiFetch.mockResolvedValueOnce(response({ first_name: 'Rosa', last_name: 'Quispe' }))
  })

  it('hydrates and persists the existing patient profile', async () => {
    apiFetch.mockResolvedValueOnce(response({}))
    render(<PatientProfileForm />)

    const firstName = screen.getByLabelText('Nombres completos')
    const lastName = screen.getByLabelText('Apellidos completos')
    await waitFor(() => {
      expect(firstName).toHaveValue('Rosa')
      expect(lastName).toHaveValue('Quispe')
    })

    fireEvent.change(firstName, { target: { value: ' Rosa María ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar perfil' }))

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2))
    expect(apiFetch).toHaveBeenLastCalledWith('/patients/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Rosa María', lastName: 'Quispe' }),
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Perfil actualizado.')
  })
})
