import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY, type AppRole } from './roles.decorator'
import type { AuthenticatedRequest } from './request-user'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required?.length) return true
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    if (!request.user || !required.some((role) => request.user.roles.includes(role)))
      throw new ForbiddenException('No tienes permiso para realizar esta acción')
    return true
  }
}
