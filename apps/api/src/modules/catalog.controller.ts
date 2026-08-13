import { Controller, Get, InternalServerErrorException } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '../common/public.decorator'
import { InsForgeService } from './insforge.service'

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(private readonly insforge: InsForgeService) {}
  @Public() @Get('specialties') async specialties() {
    const { data, error } = await this.insforge
      .publicClient()
      .database.from('specialties')
      .select('id,name,slug,active')
      .eq('active', true)
      .order('name')
    if (error) throw new InternalServerErrorException({ code: error.code, message: error.message })
    return data ?? []
  }
  @Public() @Get('districts') async districts() {
    const { data, error } = await this.insforge
      .publicClient()
      .database.from('districts')
      .select('id,name,province,active')
      .eq('active', true)
      .order('name')
    if (error) throw new InternalServerErrorException({ code: error.code, message: error.message })
    return data ?? []
  }
}
