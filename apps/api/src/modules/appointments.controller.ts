import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger'
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator'
import { Roles } from '../common/roles.decorator'
import type { AuthenticatedRequest } from '../common/request-user'
import { InsForgeService } from './insforge.service'

class CreateAppointmentDto {
  @IsUUID() doctorId: string
  @IsDateString() startsAt: string
  @ApiProperty({ enum: ['VIRTUAL', 'HOME_VISIT'] })
  @IsIn(['VIRTUAL', 'HOME_VISIT'])
  consultationMode: 'VIRTUAL' | 'HOME_VISIT'
  @ValidateIf((value: CreateAppointmentDto) => value.consultationMode === 'HOME_VISIT')
  @IsUUID()
  districtId?: string
  @ValidateIf((value: CreateAppointmentDto) => value.consultationMode === 'HOME_VISIT')
  @IsString()
  @MinLength(5)
  @MaxLength(250)
  address?: string
  @ValidateIf((value: CreateAppointmentDto) => value.consultationMode === 'HOME_VISIT')
  @IsString()
  @MinLength(3)
  @MaxLength(250)
  addressReference?: string
}
class CancelAppointmentDto {
  @IsOptional() @IsString() @MaxLength(300) reason?: string
}
class AppointmentOutcomeDto {
  @ApiProperty({ enum: ['COMPLETED', 'NO_SHOW'] })
  @IsIn(['COMPLETED', 'NO_SHOW'])
  status: 'COMPLETED' | 'NO_SHOW'
}

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly insforge: InsForgeService) {}
  @Roles('PATIENT') @Post() async create(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateAppointmentDto,
  ) {
    if (req.user.roles.includes('DOCTOR')) {
      throw new ForbiddenException('Las cuentas médicas no pueden reservar citas')
    }
    const result = await this.insforge.forUser(req.accessToken).database.rpc('book_appointment_v2', {
      requested_doctor: body.doctorId,
      requested_start: body.startsAt,
      requested_mode: body.consultationMode,
      requested_district: body.districtId ?? null,
      requested_address: body.address ?? null,
      requested_reference: body.addressReference ?? null,
    })
    return this.insforge.unwrap(result, 'APPOINTMENT_SLOT_UNAVAILABLE')
  }
  @Roles('PATIENT', 'DOCTOR', 'ADMIN') @Get('me') async mine(@Req() req: AuthenticatedRequest) {
    const result = await this.insforge
      .forUser(req.accessToken)
      .database.from('appointments')
      .select(
        'id,patient_id,doctor_id,consultation_mode,starts_at,ends_at,status,district_id,address,address_reference,virtual_meeting_url,cancellation_reason,cancelled_at,created_at',
      )
      .order('starts_at', { ascending: false })
      .limit(100)
    return this.insforge.unwrap(result)
  }
  @Roles('PATIENT', 'DOCTOR', 'ADMIN') @Patch(':id/cancel') async cancel(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: CancelAppointmentDto,
  ) {
    return this.insforge.unwrap(
      await this.insforge
        .forUser(req.accessToken)
        .database.rpc('cancel_appointment', { target_id: id, reason: body.reason ?? null }),
    )
  }
  @Roles('DOCTOR', 'ADMIN') @Patch(':id/outcome') async outcome(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: AppointmentOutcomeDto,
  ) {
    return this.insforge.unwrap(
      await this.insforge
        .forUser(req.accessToken)
        .database.rpc('set_appointment_outcome', { target_id: id, outcome: body.status }),
    )
  }
}
