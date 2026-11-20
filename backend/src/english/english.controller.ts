import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { EnglishService } from './english.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('english')
export class EnglishController {
  constructor(private readonly englishService: EnglishService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: AuthUser) {
    return this.englishService.getSummary(user.id);
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
    return this.englishService.updateProfile(user.id, body);
  }

  @Get('placement-test')
  getPlacementTest() {
    return this.englishService.getPlacementTest();
  }

  @Post('placement-submit')
  submitPlacementTest(
    @CurrentUser() user: AuthUser,
    @Body() body: { answers: Record<string, number>; writingSamples?: Record<string, string>; model?: string },
  ) {
    return this.englishService.submitPlacementTest(user.id, body);
  }

  @Get('today')
  getTodayPlan(
    @CurrentUser() user: AuthUser,
    @Query('topic') topic?: string,
    @Query('level') level?: string,
  ) {
    return this.englishService.getTodayPlan(user.id, topic, level);
  }

  @Post('srs-review')
  submitSrsReview(
    @CurrentUser() user: AuthUser,
    @Body() body: { id: string; quality: 'again' | 'hard' | 'good' | 'easy' },
  ) {
    return this.englishService.submitSrsReview(user.id, body.id, body.quality);
  }

  @Post('word-deep-dive')
  getWordDeepDive(
    @CurrentUser() user: AuthUser,
    @Body() body: { id: string; model?: string },
  ) {
    return this.englishService.getWordDeepDive(user.id, body.id, body.model);
  }

  @Post('topic-dialogue')
  generateTopicDialogue(
    @CurrentUser() user: AuthUser,
    @Body() body: { newWordIds: string[]; oldWordIds?: string[]; topic?: string; cefrLevel?: string; model?: string },
  ) {
    return this.englishService.generateTopicDialogue(user.id, body);
  }

  @Post('mixed-practice')
  generateMixedPractice(
    @CurrentUser() user: AuthUser,
    @Body() body: { newWordIds: string[]; reviewWordIds: string[]; grammarIds: string[]; cefrLevel?: string; model?: string },
  ) {
    return this.englishService.generateMixedPractice(user.id, body);
  }

  @Post('evaluate')
  evaluateAttempt(
    @Body()
    body: {
      promptVietnamese: string;
      referenceEnglish?: string;
      targetWords?: string[];
      grammarTitle?: string;
      userEnglish: string;
      cefrLevel?: string;
      model?: string;
    },
  ) {
    return this.englishService.evaluateAttempt(body);
  }

  @Post('evaluate-batch')
  evaluateBatch(
    @Body()
    body: {
      items: Array<{
        key: string;
        promptVietnamese: string;
        referenceEnglish?: string;
        targetWords?: string[];
        grammarTitle?: string;
        userEnglish: string;
      }>;
      cefrLevel?: string;
      model?: string;
    },
  ) {
    return this.englishService.evaluateBatch(body);
  }

  @Post('complete-day')
  completeDailySession(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      minutesSpent: number;
      newWordsLearned: number;
      wordsReviewed: number;
      averageScore?: number;
      model?: string;
    },
  ) {
    return this.englishService.completeDailySession(user.id, body);
  }

  @Get('vocab')
  getVocabList(@CurrentUser() user: AuthUser, @Query('level') level?: string) {
    return this.englishService.getVocabList(user.id, level);
  }

  @Get('grammar')
  getGrammarList(@CurrentUser() user: AuthUser, @Query('level') level?: string) {
    return this.englishService.getGrammarList(user.id, level);
  }

  @Patch('grammar/:id/status')
  updateGrammarStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { status: 'new' | 'learning' | 'mastered' },
  ) {
    return this.englishService.updateGrammarStatus(user.id, id, body.status);
  }
}
