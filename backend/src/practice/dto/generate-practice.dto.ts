import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class GeneratePracticeDto {
  @IsArray()
  @IsNotEmpty({ message: 'Danh sách từ vựng được chọn không được để trống' })
  vocabularyIds: string[];

  @IsInt()
  @Min(1, { message: 'Số lượng câu hỏi phải ít nhất là 1' })
  questionCount: number;

  @IsString()
  @IsNotEmpty()
  difficulty: string;

  @IsEnum(['STRICT', 'BASIC', 'FLEXIBLE'], { message: 'Chế độ từ vựng phải là STRICT, BASIC hoặc FLEXIBLE' })
  mode: 'STRICT' | 'BASIC' | 'FLEXIBLE';

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
