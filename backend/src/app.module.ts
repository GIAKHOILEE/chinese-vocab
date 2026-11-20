import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    PrismaModule,
    AuthModule,
    ChineseModule,
    VocabularyModule,
    AiModule,
    PracticeModule,
    CurriculumModule,
    EnglishModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GeminiContextMiddleware).forRoutes('*');
  }
}
