import { Body, Controller, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger'
import { IsIn } from 'class-validator'
import type { AuthenticatedRequest } from '../common/request-user'
import { InsForgeService } from './insforge.service'

class CompleteRegistrationDto {
  @ApiProperty({ enum: ['PATIENT', 'DOCTOR'] })
  @IsIn(['PATIENT', 'DOCTOR'])
  role: 'PATIENT' | 'DOCTOR'
}

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly insforge: InsForgeService) {}
  @Post('complete-registration') async complete(
    @Req() request: AuthenticatedRequest,
    @Body() body: CompleteRegistrationDto,
  ) {
    const result = await this.insforge
      .forUser(request.accessToken)
      .database.rpc('complete_registration', { initial_role: body.role })
    return { role: this.insforge.unwrap(result, 'REGISTRATION_COMPLETION_FAILED') }
  }
}
