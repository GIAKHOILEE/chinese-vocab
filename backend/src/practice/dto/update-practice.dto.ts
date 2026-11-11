import { IsOptional, IsString } from 'class-validator';

export class UpdatePracticeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
