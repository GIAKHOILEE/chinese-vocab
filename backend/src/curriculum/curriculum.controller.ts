import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';

@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Get('summary')
  getDashboardSummary() {
    return this.curriculumService.getDashboardSummary();
  }

  @Get('today')
  getTodayPlan() {
    return this.curriculumService.getTodayPlan();
  }

  @Patch('profile')
  updateProfile(
    @Body()
    body: {
      dailyMinutesTarget?: number;
      newWordsPerDay?: number;
      reviewWordsPerDay?: number;
      grammarPerDay?: number;
      preferredModel?: string;
    },
  ) {
    return this.curriculumService.updateProfile(body);
  }

  @Post('sync-hsk2')
  syncHsk2Curriculum() {
    return this.curriculumService.syncHsk2Curriculum();
  }

  @Post('ai-expand-hsk2')
  aiExpandHsk2Words(@Body() body: { topic?: string; count?: number; model?: string }) {
    return this.curriculumService.aiExpandHsk2Words(body.topic, body.count || 25, body.model);
  }

  @Post('srs-review')
  submitSrsReview(@Body() body: { vocabularyId: string; quality: 'again' | 'hard' | 'good' | 'easy' }) {
    return this.curriculumService.submitSrsReview(body.vocabularyId, body.quality);
  }

  @Post('word-deep-dive')
  getWordDeepDive(@Body() body: { vocabularyId: string; model?: string }) {
    return this.curriculumService.getWordDeepDive(body.vocabularyId, body.model);
  }

  @Post('mixed-practice')
  generateMixedPractice(
    @Body() body: { newWordIds: string[]; reviewWordIds: string[]; grammarIds: string[]; model?: string },
  ) {
    return this.curriculumService.generateMixedPractice(body);
  }

  @Post('evaluate')
  evaluateAttempt(
    @Body()
    body: {
      promptVietnamese: string;
      referenceChinese?: string;
      targetWords?: string[];
      grammarTitle?: string;
      userChinese: string;
      model?: string;
    },
  ) {
    return this.curriculumService.evaluateAttempt(body);
  }

  @Post('complete-day')
  completeDailySession(
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
    return this.curriculumService.completeDailySession(body);
  }

  @Get('grammar')
  getGrammarList() {
    return this.curriculumService.getGrammarList();
  }

  @Patch('grammar/:id/status')
  updateGrammarStatus(@Param('id') id: string, @Body() body: { status: 'new' | 'learning' | 'mastered' }) {
    return this.curriculumService.updateGrammarStatus(id, body.status);
  }
}
