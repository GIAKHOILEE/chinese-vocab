import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const rawCors = process.env.CORS_ORIGIN?.trim();
  const origin =
    !rawCors || rawCors === '*'
      ? '*'
      : rawCors
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean);

  app.enableCors({
    origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Gemini-Api-Key', 'X-Gemini-Model'],
    credentials: true,
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
  console.log(`Backend API đang chạy tại cổng http://localhost:${port}`);
}

bootstrap();
