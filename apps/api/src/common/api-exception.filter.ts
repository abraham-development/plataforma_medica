import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import type { Response } from 'express'
import type { AuthenticatedRequest } from './request-user'

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>()
    const request = host.switchToHttp().getRequest<AuthenticatedRequest>()
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const payload = exception instanceof HttpException ? exception.getResponse() : null
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(', ')
          : String(payload.message)
        : status === 500
          ? 'Ocurrió un error inesperado'
          : 'Solicitud inválida'
    const code =
      typeof payload === 'object' && payload && 'code' in payload
        ? String(payload.code)
        : `HTTP_${status}`
    response
      .status(status)
      .json({ statusCode: status, code, message, requestId: request.requestId })
  }
}
