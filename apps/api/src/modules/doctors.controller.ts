import { Controller, Get, InternalServerErrorException, Param, Query } from '@nestjs/common'
import { ApiQuery, ApiTags } from '@nestjs/swagger'
import { Public } from '../common/public.decorator'
import { InsForgeService } from './insforge.service'

@ApiTags('doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly insforge: InsForgeService) {}

  @Public()
  @Get()
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'mode', required: false, enum: ['VIRTUAL', 'HOME_VISIT'] })
  async list(@Query('name') name?: string, @Query('mode') mode?: string) {
    let query = this.insforge
      .publicClient()
      .database.from('doctor_profiles')
      .select(
        'user_id,first_name,last_name,cmp,bio,avatar_url,verification_status,offers_virtual,offers_home_visit,doctor_specialties(specialties(id,name,slug)),doctor_service_districts(districts(id,name,province))',
      )
      .eq('verification_status', 'VERIFIED')
      .limit(50)
    if (name)
      query = query.or(
        `first_name.ilike.%${name.replace(/[%_,]/g, '')}%,last_name.ilike.%${name.replace(/[%_,]/g, '')}%`,
      )
    if (mode === 'VIRTUAL') query = query.eq('offers_virtual', true)
    if (mode === 'HOME_VISIT') query = query.eq('offers_home_visit', true)
    const { data, error } = await query
    if (error) throw new InternalServerErrorException({ code: error.code, message: error.message })
    return data ?? []
  }

  @Public()
  @Get(':id')
  async detail(@Param('id') id: string) {
    const { data, error } = await this.insforge
      .publicClient()
      .database.from('doctor_profiles')
      .select(
        'user_id,first_name,last_name,cmp,bio,avatar_url,verification_status,offers_virtual,offers_home_visit,doctor_specialties(specialties(id,name,slug)),doctor_service_districts(districts(id,name,province)),doctor_availability(id,weekday,start_time,end_time,consultation_mode)',
      )
      .eq('user_id', id)
      .eq('verification_status', 'VERIFIED')
      .maybeSingle()
    if (error) throw new InternalServerErrorException({ code: error.code, message: error.message })
    return data
  }
}
