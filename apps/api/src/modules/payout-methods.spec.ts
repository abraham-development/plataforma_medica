import { Test } from '@nestjs/testing'
import { ROLES_KEY } from '../common/roles.decorator'
import { InsForgeService } from './insforge.service'
import { AdminPayoutMethodsController, PayoutMethodsController } from './payout-methods.controller'

const payoutRow = {
  id: '00000000-0000-4000-8000-000000000010',
  doctor_id: '00000000-0000-4000-8000-000000000001',
  method_type: 'YAPE' as const,
  holder_name: 'Alicia Torres',
  yape_phone: '987654321',
  bank_name: null,
  bank_account_type: null,
  bank_account_number: null,
  bank_cci: null,
  currency: 'PEN' as const,
  is_preferred: true,
  created_at: '2026-08-26T10:00:00Z',
  updated_at: '2026-08-26T10:00:00Z',
}

describe('Payout methods controllers', () => {
  it('creates a normalized doctor payout destination through the protected RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: payoutRow, error: null })
    const service = {
      forUser: () => ({ database: { rpc } }),
      unwrap: (value: { data: unknown }) => value.data,
    }
    const module = await Test.createTestingModule({
      controllers: [PayoutMethodsController],
      providers: [{ provide: InsForgeService, useValue: service }],
    }).compile()

    const controller = module.get(PayoutMethodsController)
    const result = await controller.create({ accessToken: 'doctor-token' } as never, {
      type: 'YAPE',
      holderName: '  Alicia Torres  ',
      yapePhone: '987654321',
      preferred: true,
    })

    expect(Reflect.getMetadata(ROLES_KEY, PayoutMethodsController)).toEqual(['DOCTOR'])
    expect(rpc).toHaveBeenCalledWith('upsert_doctor_payout_method', {
      requested_method_type: 'YAPE',
      target_id: null,
      requested_holder_name: 'Alicia Torres',
      requested_yape_phone: '987654321',
      requested_bank_name: null,
      requested_bank_account_type: null,
      requested_bank_account_number: null,
      requested_bank_cci: null,
      requested_preferred: true,
    })
    expect(result).toEqual(expect.objectContaining({ type: 'YAPE', preferred: true }))
  })

  it('uses the audited admin reveal RPC instead of selecting the sensitive table', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: [payoutRow], error: null })
    const service = {
      forUser: () => ({ database: { rpc } }),
      unwrap: (value: { data: unknown }) => value.data,
    }
    const module = await Test.createTestingModule({
      controllers: [AdminPayoutMethodsController],
      providers: [{ provide: InsForgeService, useValue: service }],
    }).compile()

    const controller = module.get(AdminPayoutMethodsController)
    const result = await controller.reveal(
      { accessToken: 'admin-token' } as never,
      payoutRow.doctor_id,
    )

    expect(Reflect.getMetadata(ROLES_KEY, AdminPayoutMethodsController)).toEqual(['ADMIN'])
    expect(rpc).toHaveBeenCalledWith('admin_reveal_doctor_payout_methods', {
      target_doctor: payoutRow.doctor_id,
    })
    expect(result[0]).toEqual(
      expect.objectContaining({ holderName: 'Alicia Torres', yapePhone: '987654321' }),
    )
  })
})
