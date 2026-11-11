import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateQuestionDto {
  @IsNotEmpty({ message: 'Câu tiếng Trung không được để trống' })
  @IsString()
  chinese: string;

  @IsNotEmpty({ message: 'Câu tiếng Việt không được để trống' })
  @IsString()
  vietnamese: string;

  @IsOptional()
  @IsString()
  pinyin?: string;

  @IsOptional()
  @IsArray()
  usedVocabulary?: string[];
}

