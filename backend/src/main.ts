import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import * as express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const isProd = process.env.NODE_ENV === 'production';

  // Hỗ trợ đọc đúng IP thật phía sau Reverse Proxy (Render/Railway/Nginx/Cloudflare) cho Rate Limiter
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance();
  if (typeof instance?.set === 'function') {
    instance.set('trust proxy', 1);
  }

  // HTTP Security Headers + Gzip Compression + Giới hạn payload body chống DoS
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  const rawCors = process.env.CORS_ORIGIN?.trim();
  const allowedOrigins =
    !rawCors || rawCors === '*'
      ? []
      : rawCors
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean);

  if (isProd && allowedOrigins.length === 0) {
    logger.warn(
      'CORS_ORIGIN chưa được cấu hình cụ thể trong môi trường production. Nên đặt danh sách domain Frontend rõ ràng trong backend/.env.',
    );
  }

  app.enableCors({
    origin:
      allowedOrigins.length > 0
        ? (reqOrigin, callback) => {
            if (!reqOrigin || allowedOrigins.includes(reqOrigin)) {
              return callback(null, true);
            }
            return callback(new Error(`Origin ${reqOrigin} bị từ chối bởi CORS`), false);
          }
        : isProd
          ? '*'
          : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Gemini-Api-Key', 'X-Gemini-Model'],
    // Không bật credentials=true khi origin là wildcard '*' để tuân thủ chuẩn bảo mật trình duyệt
    credentials: allowedOrigins.length > 0,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3002;
  await app.listen(port);
  logger.log(`Backend API đang chạy tại cổng http://localhost:${port}`);
}

bootstrap();
