import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Get('summary')
  getDashboardSummary(@CurrentUser() user: AuthUser) {
    return this.curriculumService.getDashboardSummary(user.id);
  }

  @Get('today')
  getTodayPlan(
    @CurrentUser() user: AuthUser,
    @Query('topic') topic?: string,
    @Query('level') level?: string,
  ) {
    return this.curriculumService.getTodayPlan(user.id, topic, level);
  }

  @Post('topic-dialogue')
  generateTopicDialogue(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      newWordIds: string[];
      oldWordIds?: string[];
      topic?: string;
      level?: string;
      model?: string;
    },
  ) {
    return this.curriculumService.generateTopicDialogue(user.id, body);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      currentLevel?: string;
      dailyMinutesTarget?: number;
      newWordsPerDay?: number;
      reviewWordsPerDay?: number;
      grammarPerDay?: number;
      preferredModel?: string;
    },
  ) {
    return this.curriculumService.updateProfile(user.id, body);
  }

  @Post('srs-review')
  submitSrsReview(
    @CurrentUser() user: AuthUser,
    @Body() body: { vocabularyId: string; quality: 'again' | 'hard' | 'good' | 'easy' },
  ) {
    return this.curriculumService.submitSrsReview(user.id, body.vocabularyId, body.quality);
  }

  @Post('word-deep-dive')
  getWordDeepDive(
    @CurrentUser() user: AuthUser,
    @Body() body: { vocabularyId: string; model?: string },
  ) {
    return this.curriculumService.getWordDeepDive(user.id, body.vocabularyId, body.model);
  }

  @Post('mixed-practice')
  generateMixedPractice(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      newWordIds: string[];
      reviewWordIds: string[];
      grammarIds: string[];
      level?: string;
      model?: string;
    },
  ) {
    return this.curriculumService.generateMixedPractice(user.id, body);
  }

  @Post('evaluate')
  evaluateAttempt(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      promptVietnamese: string;
      referenceChinese?: string;
      targetWords?: string[];
      grammarTitle?: string;
      userChinese: string;
      level?: string;
      model?: string;
    },
  ) {
    return this.curriculumService.evaluateAttempt(user.id, body);
  }

  @Post('evaluate-batch')
  evaluateBatch(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      items: Array<{
        key: string;
        promptVietnamese: string;
        referenceChinese?: string;
        targetWords?: string[];
        grammarTitle?: string;
        userChinese: string;
      }>;
      level?: string;
      model?: string;
    },
  ) {
    return this.curriculumService.evaluateBatch(user.id, body);
  }

  @Post('complete-day')
  completeDailySession(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      minutesSpent: number;
      newWordsLearned: number;
      wordsReviewed: number;
      grammarPracticed: number;
      averageScore?: number;
      weakWords?: string[];
      model?: string;
    },
  ) {
    return this.curriculumService.completeDailySession(user.id, body);
  }

  @Get('grammar')
  getGrammarList(@CurrentUser() user: AuthUser, @Query('level') level?: string) {
    return this.curriculumService.getGrammarList(user.id, level);
  }

  @Patch('grammar/:id/status')
  updateGrammarStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { status: 'new' | 'learning' | 'mastered' },
  ) {
    return this.curriculumService.updateGrammarStatus(user.id, id, body.status);
  }
}
