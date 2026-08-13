import { Body, Controller, Delete, Get, Patch, Post, Put, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger'
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator'
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
  @ApiProperty({ minimum: 1, maximum: 7 }) @IsInt() @Min(1) @Max(7) weekday: number
  @IsString() startTime: string
  @IsString() endTime: string
  @ApiProperty({ enum: ['VIRTUAL', 'HOME_VISIT'] }) @IsString() consultationMode:
    | 'VIRTUAL'
    | 'HOME_VISIT'
}
class AvailabilityDto {
  @IsArray() items: AvailabilityItemDto[]
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
  @Roles('DOCTOR') @Get('doctors/me') async doctor(@Req() req: AuthenticatedRequest) {
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
  @Roles('DOCTOR') @Put('doctors/me/availability') async availability(
    @Req() req: AuthenticatedRequest,
    @Body() body: AvailabilityDto,
  ) {
    const client = this.insforge.forUser(req.accessToken)
    await client.database.from('doctor_availability').delete().eq('doctor_id', req.user.id)
    if (!body.items.length) return []
    const result = await client.database
      .from('doctor_availability')
      .insert(
        body.items.map((item) => ({
          doctor_id: req.user.id,
          weekday: item.weekday,
          start_time: item.startTime,
          end_time: item.endTime,
          consultation_mode: item.consultationMode,
        })),
      )
      .select()
    return this.insforge.unwrap(result)
  }
}
