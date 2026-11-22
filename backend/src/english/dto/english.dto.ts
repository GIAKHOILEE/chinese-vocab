import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEnglishProfileDto {
  @IsOptional()
  @IsIn(['A1', 'A2', 'B1', 'B2'])
  currentLevel?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(300)
  dailyMinutesTarget?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  newWordsPerDay?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  reviewWordsPerDay?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  grammarPerDay?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  preferredModel?: string;
}

export class EnglishSrsReviewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  id: string;

  @IsIn(['again', 'hard', 'good', 'easy'])
  quality: 'again' | 'hard' | 'good' | 'easy';
}

export class EnglishWordDeepDiveDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  id: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;
}

export class EnglishTopicDialogueDto {
  @IsArray()
  @ArrayMaxSize(60)
  @IsString({ each: true })
  newWordIds: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(60)
  @IsString({ each: true })
  oldWordIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  topic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cefrLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;
}

export class EnglishMixedPracticeDto {
  @IsArray()
  @ArrayMaxSize(60)
  @IsString({ each: true })
  newWordIds: string[];

  @IsArray()
  @ArrayMaxSize(60)
  @IsString({ each: true })
  reviewWordIds: string[];

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  grammarIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cefrLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;
}

export class EnglishEvaluateAttemptDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  promptVietnamese: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  referenceEnglish?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  targetWords?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  grammarTitle?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  userEnglish: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  cefrLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;
}

export class EnglishBatchEvaluateItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  key: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  promptVietnamese: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  referenceEnglish?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  targetWords?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  grammarTitle?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  userEnglish: string;
}

export class EnglishEvaluateBatchDto {
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => EnglishBatchEvaluateItemDto)
  items: EnglishBatchEvaluateItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  cefrLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;
}

export class EnglishCompleteDayDto {
  @IsNumber()
  @Min(0)
  @Max(600)
  minutesSpent: number;

  @IsInt()
  @Min(0)
  @Max(200)
  newWordsLearned: number;

  @IsInt()
  @Min(0)
  @Max(300)
  wordsReviewed: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  averageScore?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;
}
