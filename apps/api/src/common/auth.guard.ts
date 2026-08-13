import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from './public.decorator'
import { InsForgeService } from '../modules/insforge.service'
import type { AuthenticatedRequest } from './request-user'
import type { AppRole } from './roles.decorator'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly insforge: InsForgeService,
  ) {}

  async canActivate(context: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const authorization = request.headers.authorization
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Sesión requerida')
    const token = authorization.slice(7)
    const client = this.insforge.forUser(token)
    const { data, error } = await client.auth.getCurrentUser()
    if (error || !data?.user) throw new UnauthorizedException('Sesión inválida o vencida')
    const rolesResult = await client.database
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
    if (rolesResult.error) throw new UnauthorizedException('No se pudo validar el acceso')
    const roles = (rolesResult.data ?? []).map((row) => (row as { role: AppRole }).role)
    request.accessToken = token
    request.user = { id: data.user.id, email: data.user.email, roles }
    return true
  }
}
