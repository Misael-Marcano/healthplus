import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ProjectsModule } from './projects/projects.module';
import { RequirementsModule } from './requirements/requirements.module';
import { VersionsModule } from './versions/versions.module';
import { ValidationModule } from './validation/validation.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { SeedModule } from './seed/seed.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'mssql',
        host: cfg.get<string>('DB_HOST', 'localhost'),
        port: parseInt(cfg.get<string>('DB_PORT', '1433'), 10),
        username: cfg.get<string>('DB_USERNAME', 'sa'),
        password: cfg.get<string>('DB_PASSWORD'),
        database: cfg.get<string>('DB_NAME', 'healthplus_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: cfg.get<string>('NODE_ENV') !== 'production',
        options: { encrypt: false, trustServerCertificate: true },
        logging: cfg.get<string>('NODE_ENV') === 'development',
      }),
    }),

    AuthModule,
    UsersModule,
    RolesModule,
    ProjectsModule,
    RequirementsModule,
    VersionsModule,
    ValidationModule,
    ReportsModule,
    AuditModule,
    SeedModule,
    SettingsModule,
  ],
})
export class AppModule {}
