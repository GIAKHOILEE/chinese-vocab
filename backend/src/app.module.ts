import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ChineseModule } from './chinese/chinese.module';
import { VocabularyModule } from './vocabulary/vocabulary.module';
import { AiModule } from './ai/ai.module';
import { PracticeModule } from './practice/practice.module';
import { CurriculumModule } from './curriculum/curriculum.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ChineseModule,
    VocabularyModule,
    AiModule,
    PracticeModule,
    CurriculumModule,
  ],
})
export class AppModule {}
