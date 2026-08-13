import { Test } from '@nestjs/testing'
import { AppointmentsController } from './appointments.controller'
import { InsForgeService } from './insforge.service'
import { ForbiddenException } from '@nestjs/common'

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
    await controller.create({ accessToken: 'token', user: { roles: ['PATIENT'] } } as never, {
      doctorId: '00000000-0000-4000-8000-000000000001',
      startsAt: '2030-01-01T15:00:00Z',
      consultationMode: 'HOME_VISIT',
      districtId: '00000000-0000-4000-8000-000000000002',
      address: 'Av. Principal 123',
      addressReference: 'Puerta azul',
    })
    expect(rpc).toHaveBeenCalledWith(
      'book_appointment_v2',
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

  it('does not allow a doctor account to create a patient appointment', async () => {
    const rpc = jest.fn()
    const service = { forUser: () => ({ database: { rpc } }), unwrap: jest.fn() }
    const module = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [{ provide: InsForgeService, useValue: service }],
    }).compile()
    const controller = module.get(AppointmentsController)
    await expect(
      controller.create({ accessToken: 'token', user: { roles: ['DOCTOR'] } } as never, {
        doctorId: '00000000-0000-4000-8000-000000000001',
        startsAt: '2030-01-01T15:00:00Z',
        consultationMode: 'VIRTUAL',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(rpc).not.toHaveBeenCalled()
  })
})
