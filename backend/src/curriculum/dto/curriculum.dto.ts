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

export class UpdateStudyProfileDto {
  @IsOptional()
  @IsIn(['HSK1', 'HSK2', 'HSK3'])
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

export class ChineseSrsReviewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  vocabularyId: string;

  @IsIn(['again', 'hard', 'good', 'easy'])
  quality: 'again' | 'hard' | 'good' | 'easy';
}

export class ChineseWordDeepDiveDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  vocabularyId: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;
}

export class ChineseTopicDialogueDto {
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
  level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;
}

export class ChineseMixedPracticeDto {
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
  level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;
}

export class ChineseEvaluateAttemptDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  promptVietnamese: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  referenceChinese?: string;

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
  userChinese: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;
}

export class ChineseBatchEvaluateItemDto {
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
  referenceChinese?: string;

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
  userChinese: string;
}

export class ChineseEvaluateBatchDto {
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ChineseBatchEvaluateItemDto)
  items: ChineseBatchEvaluateItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;
}

export class ChineseCompleteDayDto {
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

  @IsInt()
  @Min(0)
  @Max(50)
  grammarPracticed: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  averageScore?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  weakWords?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;
}

export class UpdateGrammarStatusDto {
  @IsIn(['new', 'learning', 'mastered'])
  status: 'new' | 'learning' | 'mastered';
}
