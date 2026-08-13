import { Test } from '@nestjs/testing'
import { AppointmentsController } from './appointments.controller'
import { InsForgeService } from './insforge.service'

describe('AppointmentsController', () => {
  it('passes home visit details to the transactional RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: { id: 'appointment-1' }, error: null })
    const service = {
      forUser: () => ({ database: { rpc } }),
      unwrap: (value: { data: unknown }) => value.data,
    }
    const module = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [{ provide: InsForgeService, useValue: service }],
    }).compile()
    const controller = module.get(AppointmentsController)
    await controller.create({ accessToken: 'token' } as never, {
      doctorId: '00000000-0000-4000-8000-000000000001',
      startsAt: '2030-01-01T15:00:00Z',
      consultationMode: 'HOME_VISIT',
      districtId: '00000000-0000-4000-8000-000000000002',
      address: 'Av. Principal 123',
      addressReference: 'Puerta azul',
    })
    expect(rpc).toHaveBeenCalledWith(
      'book_appointment',
      expect.objectContaining({
        requested_mode: 'HOME_VISIT',
        requested_address: 'Av. Principal 123',
      }),
    )
  })

  it('delegates appointment outcomes to the protected database transition', async () => {
    const rpc = jest
      .fn()
      .mockResolvedValue({ data: { id: 'appointment-1', status: 'COMPLETED' }, error: null })
    const service = {
      forUser: () => ({ database: { rpc } }),
      unwrap: (value: { data: unknown }) => value.data,
    }
    const module = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [{ provide: InsForgeService, useValue: service }],
    }).compile()
    const controller = module.get(AppointmentsController)
    await controller.outcome({ accessToken: 'token' } as never, 'appointment-1', {
      status: 'COMPLETED',
    })
    expect(rpc).toHaveBeenCalledWith('set_appointment_outcome', {
      target_id: 'appointment-1',
      outcome: 'COMPLETED',
    })
  })
})
