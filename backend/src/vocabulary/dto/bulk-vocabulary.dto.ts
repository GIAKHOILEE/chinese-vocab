import { ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVocabularyDto } from './create-vocabulary.dto';

export class BulkPasteDto {
  @IsNotEmpty({ message: 'Nội dung paste không được để trống' })
  @IsString()
  @MaxLength(100_000, { message: 'Nội dung paste tối đa 100.000 ký tự mỗi lần' })
  text: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  defaultLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  defaultPartOfSpeech?: string;
}

export class BulkVocabularyDto {
  @IsArray()
  @ArrayMaxSize(500, { message: 'Tối đa nhập 500 từ vựng mỗi lần' })
  @ValidateNested({ each: true })
  @Type(() => CreateVocabularyDto)
  items: CreateVocabularyDto[];
}
