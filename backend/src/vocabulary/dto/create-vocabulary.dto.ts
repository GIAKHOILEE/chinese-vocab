import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVocabularyDto {
  @IsNotEmpty({ message: 'Từ tiếng Trung không được để trống' })
  @IsString()
  @MaxLength(100)
  word: string;

  @IsNotEmpty({ message: 'Nghĩa tiếng Việt không được để trống' })
  @IsString()
  @MaxLength(300)
  meaning: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  pinyin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  partOfSpeech?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  topic?: string;
}
