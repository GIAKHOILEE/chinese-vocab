import { Module } from '@nestjs/common';
import { PinyinService } from './pinyin.service';
import { ChineseTokenizerService } from './chinese-tokenizer.service';
import { AiValidationService } from './ai-validation.service';

@Module({
  providers: [PinyinService, ChineseTokenizerService, AiValidationService],
  exports: [PinyinService, ChineseTokenizerService, AiValidationService],
})
export class ChineseModule {}
