import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { join } from 'node:path'
import { HealthController } from './modules/health.controller'
import { InsForgeService } from './modules/insforge.service'
import { AuthGuard } from './common/auth.guard'
import { RolesGuard } from './common/roles.guard'
import { CatalogController } from './modules/catalog.controller'
import { DoctorsController } from './modules/doctors.controller'
import { AuthController } from './modules/auth.controller'
import { ProfilesController } from './modules/profiles.controller'
import { AppointmentsController } from './modules/appointments.controller'
import { AdminController } from './modules/admin.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '..', '.env.production'),
        join(__dirname, '..', '.env'),
        '.env.production',
        '.env',
      ],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
  ],
  controllers: [
    HealthController,
    CatalogController,
    DoctorsController,
    AuthController,
    ProfilesController,
    AppointmentsController,
    AdminController,
  ],
  providers: [
    InsForgeService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
