import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVocabularyDto } from './create-vocabulary.dto';

export class BulkPasteDto {
  @IsNotEmpty({ message: 'Nội dung paste không được để trống' })
  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  defaultLevel?: string;
}

export class BulkVocabularyDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVocabularyDto)
  items: CreateVocabularyDto[];
}
