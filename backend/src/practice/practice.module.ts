import { Module } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { PracticeController } from './practice.controller';
import { AiModule } from '../ai/ai.module';
import { ChineseModule } from '../chinese/chinese.module';

@Module({
  imports: [AiModule, ChineseModule],
  controllers: [PracticeController],
  providers: [PracticeService],
  exports: [PracticeService],
})
export class PracticeModule {}
