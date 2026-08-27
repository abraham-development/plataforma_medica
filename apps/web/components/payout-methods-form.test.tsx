import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { authenticatedApiFetch } from '@/lib/insforge/authenticated-fetch'
import { PayoutMethodsForm } from './payout-methods-form'

jest.mock('@/lib/insforge/authenticated-fetch', () => ({
  authenticatedApiFetch: jest.fn(),
  handleSessionError: jest.fn(() => false),
}))

const apiFetch = jest.mocked(authenticatedApiFetch)

function response(body: unknown, ok = true) {
  return { ok, json: jest.fn().mockResolvedValue(body) } as unknown as Response
}

describe('PayoutMethodsForm', () => {
  beforeEach(() => jest.clearAllMocks())

  it('creates a Yape destination and explains that patients pay MediCerca', async () => {
    apiFetch
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response({ id: 'method-1' }))
      .mockResolvedValueOnce(response([]))

    render(<PayoutMethodsForm />)

    expect(screen.getByText('MediCerca recibe primero el pago del paciente')).toBeVisible()
    await screen.findByText('Aún no registraste un destino de pago.')
    fireEvent.change(screen.getByLabelText('Titular del método'), {
      target: { value: 'Alicia Torres' },
    })
    fireEvent.change(screen.getByLabelText('Número de celular Yape'), {
      target: { value: '987 654 321' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Agregar método' }))

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(3))
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/doctors/me/payout-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'YAPE',
        holderName: 'Alicia Torres',
        yapePhone: '987654321',
        preferred: false,
      }),
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Método agregado.')
  })

  it('never renders a full saved account number in the doctor list', async () => {
    apiFetch.mockResolvedValueOnce(
      response([
        {
          id: 'method-1',
          type: 'BANK_ACCOUNT',
          holderName: 'Alicia Torres',
          yapePhone: null,
          bankName: 'Banco Demo',
          bankAccountType: 'SAVINGS',
          bankAccountNumber: '1234567890123456',
          cci: null,
          currency: 'PEN',
          preferred: true,
          createdAt: '2026-08-26T10:00:00Z',
          updatedAt: '2026-08-26T10:00:00Z',
        },
      ]),
    )

    render(<PayoutMethodsForm />)

    expect(await screen.findByText('•••• 3456')).toBeVisible()
    expect(screen.queryByText('1234567890123456')).not.toBeInTheDocument()
  })
})
