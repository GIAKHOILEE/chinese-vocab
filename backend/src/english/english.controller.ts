import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EnglishService } from './english.service';

@Controller('english')
export class EnglishController {
  constructor(private readonly englishService: EnglishService) {}

  @Get('summary')
  getSummary() {
    return this.englishService.getSummary();
  }

  @Post('sync')
  syncCurriculum() {
    return this.englishService.syncCurriculum();
  }

  @Patch('profile')
  updateProfile(
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
    return this.englishService.updateProfile(body);
  }

  @Get('placement-test')
  getPlacementTest() {
    return this.englishService.getPlacementTest();
  }

  @Post('placement-submit')
  submitPlacementTest(
    @Body() body: { answers: Record<string, number>; writingSamples?: Record<string, string>; model?: string },
  ) {
    return this.englishService.submitPlacementTest(body);
  }

  @Get('today')
  getTodayPlan(@Query('topic') topic?: string, @Query('level') level?: string) {
    return this.englishService.getTodayPlan(topic, level);
  }

  @Post('ai-expand')
  aiExpandWords(@Body() body: { cefrLevel: string; topic?: string; count?: number; model?: string }) {
    return this.englishService.aiExpandWords(body.cefrLevel, body.topic, body.count || 20, body.model);
  }

  @Post('srs-review')
  submitSrsReview(@Body() body: { id: string; quality: 'again' | 'hard' | 'good' | 'easy' }) {
    return this.englishService.submitSrsReview(body.id, body.quality);
  }

  @Post('word-deep-dive')
  getWordDeepDive(@Body() body: { id: string; model?: string }) {
    return this.englishService.getWordDeepDive(body.id, body.model);
  }

  @Post('topic-dialogue')
  generateTopicDialogue(
    @Body() body: { newWordIds: string[]; oldWordIds?: string[]; topic?: string; cefrLevel?: string; model?: string },
  ) {
    return this.englishService.generateTopicDialogue(body);
  }

  @Post('mixed-practice')
  generateMixedPractice(
    @Body() body: { newWordIds: string[]; reviewWordIds: string[]; grammarIds: string[]; cefrLevel?: string; model?: string },
  ) {
    return this.englishService.generateMixedPractice(body);
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
    @Body()
    body: {
      minutesSpent: number;
      newWordsLearned: number;
      wordsReviewed: number;
      averageScore?: number;
      model?: string;
    },
  ) {
    return this.englishService.completeDailySession(body);
  }

  @Get('grammar')
  getGrammarList(@Query('level') level?: string) {
    return this.englishService.getGrammarList(level);
  }

  @Patch('grammar/:id/status')
  updateGrammarStatus(@Param('id') id: string, @Body() body: { status: 'new' | 'learning' | 'mastered' }) {
    return this.englishService.updateGrammarStatus(id, body.status);
  }
}
