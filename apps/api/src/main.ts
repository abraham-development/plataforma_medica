import 'reflect-metadata'
import { randomUUID } from 'node:crypto'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { ApiExceptionFilter } from './common/api-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.setGlobalPrefix('api/v1')
  app.use(helmet())
  app.enableCors({
    origin: process.env.WEB_URL?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  })
  app.use(
    (
      request: { requestId?: string },
      response: { setHeader(name: string, value: string): void },
      next: () => void,
    ) => {
      request.requestId = randomUUID()
      response.setHeader('X-Request-Id', request.requestId)
      next()
    },
  )
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  )
  app.useGlobalFilters(new ApiExceptionFilter())

  const config = new DocumentBuilder()
    .setTitle('MediCerca API')
    .setDescription('API del marketplace médico para Lima y Callao')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config))
  await app.listen(Number(process.env.PORT ?? 3000))
}

void bootstrap()
