import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AiSentenceGeneratorService } from './ai-sentence-generator.service';
import { ChineseModule } from '../chinese/chinese.module';

@Module({
  imports: [ChineseModule],
  providers: [GeminiService, AiSentenceGeneratorService],
  exports: [GeminiService, AiSentenceGeneratorService],
})
export class AiModule {}
