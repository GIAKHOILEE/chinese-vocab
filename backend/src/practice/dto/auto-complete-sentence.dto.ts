import { IsOptional, IsString } from 'class-validator';

export class AutoCompleteSentenceDto {
  @IsOptional()
  @IsString()
  chinese?: string;

  @IsOptional()
  @IsString()
  vietnamese?: string;
}

