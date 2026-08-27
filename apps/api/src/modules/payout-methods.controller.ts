import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator'
import { Roles } from '../common/roles.decorator'
import type { AuthenticatedRequest } from '../common/request-user'
import { InsForgeService } from './insforge.service'

type PayoutMethodRow = {
  id: string
  doctor_id: string
  method_type: 'YAPE' | 'BANK_ACCOUNT'
  holder_name: string
  yape_phone: string | null
  bank_name: string | null
  bank_account_type: 'SAVINGS' | 'CHECKING' | null
  bank_account_number: string | null
  bank_cci: string | null
  currency: 'PEN'
  is_preferred: boolean
  created_at: string
  updated_at: string
}

type AdminPayoutSummaryRow = {
  doctor_id: string
  doctor_name: string
  verification_status: string
  method_count: number | string
  preferred_type: 'YAPE' | 'BANK_ACCOUNT' | null
  preferred_masked_destination: string | null
  methods_updated_at: string | null
}

function digits(value: unknown) {
  return typeof value === 'string' ? value.replace(/\D/g, '') : value
}

function peruvianPhone(value: unknown) {
  const normalized = digits(value)
  if (typeof normalized !== 'string') return normalized
  return normalized.length === 11 && normalized.startsWith('51') ? normalized.slice(2) : normalized
}

function optionalDigits(value: unknown) {
  const normalized = digits(value)
  return normalized === '' ? undefined : normalized
}

export class PayoutMethodDto {
  @ApiProperty({ enum: ['YAPE', 'BANK_ACCOUNT'] })
  @IsIn(['YAPE', 'BANK_ACCOUNT'])
  type: 'YAPE' | 'BANK_ACCOUNT'

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  holderName: string

  @ValidateIf((body: PayoutMethodDto) => body.type === 'YAPE')
  @Transform(({ value }) => peruvianPhone(value))
  @Matches(/^9\d{8}$/)
  yapePhone?: string

  @ValidateIf((body: PayoutMethodDto) => body.type === 'BANK_ACCOUNT')
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  bankName?: string

  @ValidateIf((body: PayoutMethodDto) => body.type === 'BANK_ACCOUNT')
  @IsIn(['SAVINGS', 'CHECKING'])
  bankAccountType?: 'SAVINGS' | 'CHECKING'

  @ValidateIf((body: PayoutMethodDto) => body.type === 'BANK_ACCOUNT')
  @Transform(({ value }) => digits(value))
  @Matches(/^\d{6,30}$/)
  bankAccountNumber?: string

  @IsOptional()
  @Transform(({ value }) => optionalDigits(value))
  @Matches(/^\d{20}$/)
  cci?: string

  @IsOptional()
  @IsBoolean()
  preferred?: boolean
}

function payoutMethod(row: PayoutMethodRow) {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    type: row.method_type,
    holderName: row.holder_name,
    yapePhone: row.yape_phone,
    bankName: row.bank_name,
    bankAccountType: row.bank_account_type,
    bankAccountNumber: row.bank_account_number,
    cci: row.bank_cci,
    currency: row.currency,
    preferred: row.is_preferred,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function summary(row: AdminPayoutSummaryRow) {
  return {
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    verificationStatus: row.verification_status,
    methodCount: Number(row.method_count),
    preferredType: row.preferred_type,
    preferredMaskedDestination: row.preferred_masked_destination,
    methodsUpdatedAt: row.methods_updated_at,
  }
}

@ApiTags('payout-methods')
@ApiBearerAuth()
@Roles('DOCTOR')
@Controller('doctors/me/payout-methods')
export class PayoutMethodsController {
  constructor(private readonly insforge: InsForgeService) {}

  private client(req: AuthenticatedRequest) {
    return this.insforge.forUser(req.accessToken)
  }

  private rpcPayload(body: PayoutMethodDto, id: string | null) {
    return {
      requested_method_type: body.type,
      target_id: id,
      requested_holder_name: body.holderName.trim(),
      requested_yape_phone: body.type === 'YAPE' ? body.yapePhone : null,
      requested_bank_name: body.type === 'BANK_ACCOUNT' ? body.bankName?.trim() : null,
      requested_bank_account_type: body.type === 'BANK_ACCOUNT' ? body.bankAccountType : null,
      requested_bank_account_number: body.type === 'BANK_ACCOUNT' ? body.bankAccountNumber : null,
      requested_bank_cci: body.type === 'BANK_ACCOUNT' ? (body.cci ?? null) : null,
      requested_preferred: body.preferred ?? false,
    }
  }

  @Get()
  @Header('Cache-Control', 'private, no-store')
  async list(@Req() req: AuthenticatedRequest) {
    const rows = this.insforge.unwrap(
      await this.client(req)
        .database.from('doctor_payout_methods')
        .select(
          'id,doctor_id,method_type,holder_name,yape_phone,bank_name,bank_account_type,bank_account_number,bank_cci,currency,is_preferred,created_at,updated_at',
        )
        .eq('doctor_id', req.user.id)
        .order('is_preferred', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(20),
    ) as PayoutMethodRow[]
    return rows.map(payoutMethod)
  }

  @Post()
  @Header('Cache-Control', 'private, no-store')
  async create(@Req() req: AuthenticatedRequest, @Body() body: PayoutMethodDto) {
    const row = this.insforge.unwrap(
      await this.client(req).database.rpc(
        'upsert_doctor_payout_method',
        this.rpcPayload(body, null),
      ),
    ) as PayoutMethodRow
    return payoutMethod(row)
  }

  @Patch(':id')
  @Header('Cache-Control', 'private, no-store')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: PayoutMethodDto,
  ) {
    const row = this.insforge.unwrap(
      await this.client(req).database.rpc('upsert_doctor_payout_method', this.rpcPayload(body, id)),
    ) as PayoutMethodRow
    return payoutMethod(row)
  }

  @Delete(':id')
  @Header('Cache-Control', 'private, no-store')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.insforge.unwrap(
      await this.client(req).database.rpc('delete_doctor_payout_method', { target_id: id }),
    )
    return { deleted: true }
  }

  @Post(':id/preferred')
  @Header('Cache-Control', 'private, no-store')
  async preferred(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const row = this.insforge.unwrap(
      await this.client(req).database.rpc('set_preferred_doctor_payout_method', {
        target_id: id,
      }),
    ) as PayoutMethodRow
    return payoutMethod(row)
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminPayoutMethodsController {
  constructor(private readonly insforge: InsForgeService) {}

  private client(req: AuthenticatedRequest) {
    return this.insforge.forUser(req.accessToken)
  }

  @Get('doctor-payout-methods')
  @Header('Cache-Control', 'private, no-store')
  async list(@Req() req: AuthenticatedRequest) {
    const rows = this.insforge.unwrap(
      await this.client(req).database.rpc('admin_list_doctor_payout_summaries'),
    ) as AdminPayoutSummaryRow[]
    return rows.map(summary)
  }

  @Post('doctors/:id/payout-methods/reveal')
  @Header('Cache-Control', 'private, no-store')
  async reveal(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const rows = this.insforge.unwrap(
      await this.client(req).database.rpc('admin_reveal_doctor_payout_methods', {
        target_doctor: id,
      }),
    ) as PayoutMethodRow[]
    return rows.map(payoutMethod)
  }
}
