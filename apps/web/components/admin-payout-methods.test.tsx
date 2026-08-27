import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { authenticatedApiFetch } from '@/lib/insforge/authenticated-fetch'
import { AdminPayoutMethods } from './admin-payout-methods'

jest.mock('@/lib/insforge/authenticated-fetch', () => ({
  authenticatedApiFetch: jest.fn(),
  handleSessionError: jest.fn(() => false),
}))

const apiFetch = jest.mocked(authenticatedApiFetch)

function response(body: unknown, ok = true) {
  return { ok, json: jest.fn().mockResolvedValue(body) } as unknown as Response
}

describe('AdminPayoutMethods', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows masked summaries and reveals full values only after the audited action', async () => {
    apiFetch
      .mockResolvedValueOnce(
        response([
          {
            doctorId: 'doctor-1',
            doctorName: 'Alicia Torres',
            verificationStatus: 'VERIFIED',
            methodCount: 1,
            preferredType: 'YAPE',
            preferredMaskedDestination: 'Yape ••• 321',
            methodsUpdatedAt: '2026-08-26T10:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(
        response([
          {
            id: 'method-1',
            type: 'YAPE',
            holderName: 'Alicia Torres',
            yapePhone: '987654321',
            bankName: null,
            bankAccountType: null,
            bankAccountNumber: null,
            cci: null,
            currency: 'PEN',
            preferred: true,
          },
        ]),
      )

    render(<AdminPayoutMethods />)

    expect(await screen.findByText('Yape ••• 321')).toBeVisible()
    expect(screen.queryByText('987654321')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver datos' }))

    await waitFor(() =>
      expect(apiFetch).toHaveBeenLastCalledWith('/admin/doctors/doctor-1/payout-methods/reveal', {
        method: 'POST',
      }),
    )
    expect(await screen.findByText('987654321')).toBeVisible()
    expect(screen.getByText('Esta consulta ya fue registrada en auditoría.')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar datos revelados' }))
    expect(screen.queryByText('987654321')).not.toBeInTheDocument()
  })
})
