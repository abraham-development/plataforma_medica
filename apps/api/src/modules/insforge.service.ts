import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, type InsForgeClient } from '@insforge/sdk'

@Injectable()
export class InsForgeService {
  readonly baseUrl: string
  readonly anonKey: string
  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('INSFORGE_URL')
    this.anonKey = config.getOrThrow<string>('INSFORGE_ANON_KEY')
  }
  publicClient(): InsForgeClient {
    return createClient({ baseUrl: this.baseUrl, anonKey: this.anonKey })
  }
  forUser(accessToken: string): InsForgeClient {
    return createClient({ baseUrl: this.baseUrl, anonKey: this.anonKey, accessToken })
  }
  unwrap<T>(
    result: { data: T | null; error: { message?: string; error?: string } | null },
    fallback = 'INSFORGE_REQUEST_FAILED',
  ): T {
    if (result.error || result.data === null)
      throw new InternalServerErrorException({
        code: result.error?.error ?? fallback,
        message: result.error?.message ?? 'No se pudo completar la operación',
      })
    return result.data
  }
}
