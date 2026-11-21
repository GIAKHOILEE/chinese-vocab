import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const INSECURE_DEFAULTS = new Set([
  'chinese-vocab-dev-jwt-secret-please-change-in-production',
  'change-this-to-a-long-random-secret',
  'chinese-vocab-docker-jwt-secret',
  'secret',
]);

@Global()
@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('AuthModule');
        const configured = (configService.get<string>('JWT_SECRET') || '').trim();
        const isProd = configService.get<string>('NODE_ENV') === 'production';

        if (!configured || INSECURE_DEFAULTS.has(configured) || configured.length < 24) {
          if (isProd) {
            throw new Error(
              'JWT_SECRET không an toàn hoặc chưa được cấu hình cho môi trường production (yêu cầu tối thiểu 24 ký tự ngẫu nhiên).',
            );
          }
          logger.warn(
            'Đang dùng JWT_SECRET mặc định/yếu cho môi trường dev. Hãy đặt JWT_SECRET dài >= 24 ký tự trong backend/.env trước khi deploy.',
          );
        }

        const secret = configured || 'chinese-vocab-dev-jwt-secret-please-change-in-production';
        const expiresIn = (configService.get<string>('JWT_EXPIRES_IN') || '7d') as any;

        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
