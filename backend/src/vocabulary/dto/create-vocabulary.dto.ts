import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVocabularyDto {
  @IsNotEmpty({ message: 'Từ tiếng Trung không được để trống' })
  @IsString()
  word: string;

  @IsNotEmpty({ message: 'Nghĩa tiếng Việt không được để trống' })
  @IsString()
  meaning: string;

  @IsOptional()
  @IsString()
  pinyin?: string;

  @IsOptional()
  @IsString()
  level?: string;
}
