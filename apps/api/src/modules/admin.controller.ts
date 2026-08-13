import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import { Roles } from '../common/roles.decorator'
import type { AuthenticatedRequest } from '../common/request-user'
import { InsForgeService } from './insforge.service'

class DoctorStatusDto {
  @IsIn(['VERIFIED', 'REJECTED', 'SUSPENDED', 'PENDING']) status: string
  @IsOptional() @IsString() @MaxLength(300) reason?: string
}
class AccountStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED']) status: string
  @IsString() @MaxLength(300) reason: string
}
class SpecialtyDto {
  @IsString() @MaxLength(100) name: string
  @IsOptional() @IsBoolean() active?: boolean
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly insforge: InsForgeService) {}
  private client(req: AuthenticatedRequest) {
    return this.insforge.forUser(req.accessToken)
  }
  @Get('dashboard') async dashboard(@Req() req: AuthenticatedRequest) {
    return this.insforge.unwrap(await this.client(req).database.rpc('admin_dashboard'))
  }
  @Get('doctors') async doctors(@Req() req: AuthenticatedRequest) {
    return this.insforge.unwrap(
      await this.client(req)
        .database.from('doctor_profiles')
        .select('user_id,first_name,last_name,cmp,verification_status,submitted_at,created_at')
        .order('created_at', { ascending: false })
        .limit(200),
    )
  }
  @Patch('doctors/:id/status') async doctorStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: DoctorStatusDto,
  ) {
    return this.insforge.unwrap(
      await this.client(req).database.rpc('admin_set_doctor_status', {
        target_doctor: id,
        target_status: body.status,
        reason: body.reason ?? null,
      }),
    )
  }
  @Get('users') async users(@Req() req: AuthenticatedRequest) {
    return this.insforge.unwrap(
      await this.client(req)
        .database.from('users')
        .select('id,display_name,account_status,created_at,user_roles(role)')
        .order('created_at', { ascending: false })
        .limit(200),
    )
  }
  @Patch('users/:id/status') async userStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: AccountStatusDto,
  ) {
    return this.insforge.unwrap(
      await this.client(req).database.rpc('admin_set_account_status', {
        target_user: id,
        target_status: body.status,
        reason: body.reason,
      }),
    )
  }
  @Get('appointments') async appointments(@Req() req: AuthenticatedRequest) {
    return this.insforge.unwrap(
      await this.client(req)
        .database.from('appointments')
        .select(
          'id,patient_id,doctor_id,consultation_mode,starts_at,ends_at,status,cancelled_at,created_at',
        )
        .order('starts_at', { ascending: false })
        .limit(200),
    )
  }
  @Get('audit') async audit(@Req() req: AuthenticatedRequest) {
    return this.insforge.unwrap(
      await this.client(req)
        .database.from('admin_audit_logs')
        .select('id,admin_user_id,action,entity_type,entity_id,metadata,created_at')
        .order('created_at', { ascending: false })
        .limit(200),
    )
  }
  @Post('specialties') async specialty(
    @Req() req: AuthenticatedRequest,
    @Body() body: SpecialtyDto,
  ) {
    return this.insforge.unwrap(
      await this.client(req).database.rpc('admin_upsert_specialty', {
        specialty_id: null,
        specialty_name: body.name,
        specialty_active: body.active ?? true,
      }),
    )
  }
  @Patch('specialties/:id') async updateSpecialty(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: SpecialtyDto,
  ) {
    return this.insforge.unwrap(
      await this.client(req).database.rpc('admin_upsert_specialty', {
        specialty_id: id,
        specialty_name: body.name,
        specialty_active: body.active ?? true,
      }),
    )
  }
}
