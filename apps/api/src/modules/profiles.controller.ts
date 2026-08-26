import { Body, Controller, Delete, Get, Patch, Post, Put, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger'
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { Roles } from '../common/roles.decorator'
import type { AuthenticatedRequest } from '../common/request-user'
import { InsForgeService } from './insforge.service'

class PatientProfileDto {
  @IsString() @MaxLength(80) firstName: string
  @IsString() @MaxLength(100) lastName: string
}
class DoctorProfileDto extends PatientProfileDto {
  @IsString() @MaxLength(20) cmp: string
  @IsString() @MaxLength(1200) bio: string
  @IsBoolean() offersVirtual: boolean
  @IsBoolean() offersHomeVisit: boolean
  @IsOptional() @IsUrl({ protocols: ['https'], require_protocol: true }) virtualMeetingUrl?: string
  @IsArray() specialtyIds: string[]
  @IsArray() districtIds: string[]
}
class AvailabilityItemDto {
  @ApiProperty({ example: '2026-08-18' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  availabilityDate: string

  @Matches(/^([01]\d|2[0-3]):(00|30)$/) startTime: string
  @Matches(/^([01]\d|2[0-3]):(00|30)$/) endTime: string
  @ApiProperty({ enum: ['VIRTUAL', 'HOME_VISIT'] })
  @IsIn(['VIRTUAL', 'HOME_VISIT'])
  consultationMode: 'VIRTUAL' | 'HOME_VISIT'
}
class AvailabilityDto {
  @IsArray()
  @ArrayMaxSize(600)
  @ValidateNested({ each: true })
  @Type(() => AvailabilityItemDto)
  items: AvailabilityItemDto[]
}

@ApiTags('profiles')
@ApiBearerAuth()
@Controller()
export class ProfilesController {
  constructor(private readonly insforge: InsForgeService) {}
  @Roles('PATIENT') @Get('patients/me') async patient(@Req() req: AuthenticatedRequest) {
    return this.insforge.unwrap(
      await this.insforge
        .forUser(req.accessToken)
        .database.from('patient_profiles')
        .select('user_id,first_name,last_name')
        .eq('user_id', req.user.id)
        .single(),
    )
  }
  @Roles('PATIENT') @Patch('patients/me') async updatePatient(
    @Req() req: AuthenticatedRequest,
    @Body() body: PatientProfileDto,
  ) {
    return this.insforge.unwrap(
      await this.insforge
        .forUser(req.accessToken)
        .database.from('patient_profiles')
        .update({ first_name: body.firstName.trim(), last_name: body.lastName.trim() })
        .eq('user_id', req.user.id)
        .select()
        .single(),
    )
  }
  @Roles('DOCTOR') @Get('me/doctor-profile') async doctor(@Req() req: AuthenticatedRequest) {
    return this.insforge.unwrap(
      await this.insforge
        .forUser(req.accessToken)
        .database.from('doctor_profiles')
        .select(
          '*,doctor_specialties(specialty_id),doctor_service_districts(district_id),doctor_availability(*)',
        )
        .eq('user_id', req.user.id)
        .single(),
    )
  }
  @Roles('DOCTOR') @Patch('doctors/me') async updateDoctor(
    @Req() req: AuthenticatedRequest,
    @Body() body: DoctorProfileDto,
  ) {
    const client = this.insforge.forUser(req.accessToken)
    const profile = await client.database
      .from('doctor_profiles')
      .update({
        first_name: body.firstName.trim(),
        last_name: body.lastName.trim(),
        cmp: body.cmp.trim(),
        bio: body.bio.trim(),
        offers_virtual: body.offersVirtual,
        offers_home_visit: body.offersHomeVisit,
        virtual_meeting_url: body.offersVirtual ? (body.virtualMeetingUrl ?? null) : null,
        submitted_at: new Date().toISOString(),
      })
      .eq('user_id', req.user.id)
      .select()
      .single()
    this.insforge.unwrap(profile)
    await client.database.from('doctor_specialties').delete().eq('doctor_id', req.user.id)
    if (body.specialtyIds.length)
      this.insforge.unwrap(
        await client.database
          .from('doctor_specialties')
          .insert(
            body.specialtyIds.map((specialty_id) => ({ doctor_id: req.user.id, specialty_id })),
          ),
      )
    await client.database.from('doctor_service_districts').delete().eq('doctor_id', req.user.id)
    if (body.offersHomeVisit && body.districtIds.length)
      this.insforge.unwrap(
        await client.database
          .from('doctor_service_districts')
          .insert(body.districtIds.map((district_id) => ({ doctor_id: req.user.id, district_id }))),
      )
    return profile.data
  }
  @Roles('DOCTOR') @Get('doctors/me/availability') async getAvailability(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.insforge.unwrap(
      await this.insforge
        .forUser(req.accessToken)
        .database.from('doctor_availability_dates')
        .select('id,availability_date,start_time,end_time,consultation_mode')
        .eq('doctor_id', req.user.id)
        .eq('active', true)
        .gte(
          'availability_date',
          new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }),
        )
        .order('availability_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(600),
    )
  }
  @Roles('DOCTOR') @Put('doctors/me/availability') async availability(
    @Req() req: AuthenticatedRequest,
    @Body() body: AvailabilityDto,
  ) {
    const client = this.insforge.forUser(req.accessToken)
    const result = await client.database.rpc('replace_doctor_availability_dates', {
      availability_items: body.items.map((item) => ({
        availability_date: item.availabilityDate,
        start_time: item.startTime,
        end_time: item.endTime,
        consultation_mode: item.consultationMode,
      })),
    })
    return this.insforge.unwrap(result)
  }
}
