import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DoctorProfileForm } from './doctor-profile-form'
import { authenticatedApiFetch } from '@/lib/insforge/authenticated-fetch'

jest.mock('@/lib/insforge/authenticated-fetch', () => ({
  authenticatedApiFetch: jest.fn(),
  handleSessionError: jest.fn(() => false),
}))

jest.mock('@/lib/insforge/client', () => ({
  insforge: {
    database: {
      from: jest.fn((table: string) => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data:
                table === 'specialties'
                  ? [{ id: 'specialty-1', name: 'Medicina general' }]
                  : [{ id: 'district-1', name: 'Miraflores' }],
              error: null,
            }),
          })),
        })),
      })),
    },
  },
}))

const apiFetch = jest.mocked(authenticatedApiFetch)

function response(body: unknown, ok = true) {
  return { ok, json: jest.fn().mockResolvedValue(body) } as unknown as Response
}

describe('DoctorProfileForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    apiFetch.mockResolvedValueOnce(
      response({
        first_name: 'Andrea',
        last_name: 'Salazar',
        cmp: '12345',
        bio: 'Médica con experiencia clínica.',
        offers_virtual: true,
        offers_home_visit: true,
        virtual_meeting_url: 'https://meet.example.test/andrea',
        doctor_specialties: [{ specialty_id: 'specialty-1' }],
        doctor_service_districts: [{ district_id: 'district-1' }],
      }),
    )
  })

  it('hydrates and persists the full doctor profile', async () => {
    apiFetch.mockResolvedValueOnce(response({}))
    render(<DoctorProfileForm />)

    expect(await screen.findByDisplayValue('Andrea')).toBeEnabled()
    expect(screen.getByDisplayValue('Salazar')).toBeEnabled()
    expect(screen.getByDisplayValue('12345')).toBeEnabled()
    expect(screen.getByLabelText('Consulta virtual')).toBeChecked()
    expect(screen.getByLabelText('Atención a domicilio')).toBeChecked()
    expect(screen.getByLabelText('Medicina general')).toBeChecked()
    expect(screen.getByLabelText('Miraflores')).toBeChecked()

    fireEvent.change(screen.getByDisplayValue('Andrea'), {
      target: { value: 'Andrea Lucía' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y enviar a revisión' }))

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2))
    expect(apiFetch).toHaveBeenLastCalledWith('/doctors/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Andrea Lucía',
        lastName: 'Salazar',
        cmp: '12345',
        bio: 'Médica con experiencia clínica.',
        offersVirtual: true,
        offersHomeVisit: true,
        virtualMeetingUrl: 'https://meet.example.test/andrea',
        specialtyIds: ['specialty-1'],
        districtIds: ['district-1'],
      }),
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Perfil enviado para verificación.')
  })
})
