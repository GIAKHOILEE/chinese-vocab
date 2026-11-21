import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GeneratePracticeDto {
  @IsArray()
  @IsNotEmpty({ message: 'Danh sách từ vựng được chọn không được để trống' })
  @ArrayMaxSize(200, { message: 'Tối đa chọn 200 từ vựng mỗi lần tạo bài' })
  @IsString({ each: true })
  vocabularyIds: string[];

  @IsInt()
  @Min(1, { message: 'Số lượng câu hỏi phải ít nhất là 1' })
  @Max(50, { message: 'Tối đa 50 câu hỏi mỗi lần tạo bài' })
  questionCount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  difficulty: string;

  @IsEnum(['STRICT', 'BASIC', 'FLEXIBLE'], { message: 'Chế độ từ vựng phải là STRICT, BASIC hoặc FLEXIBLE' })
  mode: 'STRICT' | 'BASIC' | 'FLEXIBLE';

  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
