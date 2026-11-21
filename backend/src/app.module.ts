import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { ChineseModule } from './chinese/chinese.module';
import { VocabularyModule } from './vocabulary/vocabulary.module';
import { AiModule } from './ai/ai.module';
import { GeminiContextMiddleware } from './ai/gemini-context.middleware';
import { PracticeModule } from './practice/practice.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { EnglishModule } from './english/english.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    AuthModule,
    ChineseModule,
    VocabularyModule,
    AiModule,
    PracticeModule,
    CurriculumModule,
    EnglishModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GeminiContextMiddleware).forRoutes('*');
  }
}
