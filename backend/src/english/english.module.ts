import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { EnglishController } from './english.controller';
import { EnglishService } from './english.service';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [EnglishController],
  providers: [EnglishService],
})
export class EnglishModule {}
