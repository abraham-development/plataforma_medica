import type { Request } from 'express'
import type { AppRole } from './roles.decorator'

export interface AuthenticatedUser {
  id: string
  email: string
  roles: AppRole[]
}
export interface AuthenticatedRequest extends Request {
  accessToken: string
  user: AuthenticatedUser
  requestId?: string
}
