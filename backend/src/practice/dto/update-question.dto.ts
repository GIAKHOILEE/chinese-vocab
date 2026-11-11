import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  chinese?: string;

  @IsOptional()
  @IsString()
  vietnamese?: string;

  @IsOptional()
  @IsString()
  pinyin?: string;

  @IsOptional()
  @IsArray()
  usedVocabulary?: string[];
}

