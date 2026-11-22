import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurriculumService } from './curriculum.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import {
  ChineseCompleteDayDto,
  ChineseEvaluateAttemptDto,
  ChineseEvaluateBatchDto,
  ChineseMixedPracticeDto,
  ChineseSrsReviewDto,
  ChineseTopicDialogueDto,
  ChineseWordDeepDiveDto,
  UpdateGrammarStatusDto,
  UpdateStudyProfileDto,
} from './dto/curriculum.dto';

@UseGuards(JwtAuthGuard)
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Get('summary')
  getDashboardSummary(@CurrentUser() user: AuthUser) {
    return this.curriculumService.getDashboardSummary(user.id);
  }

  @Get('logs')
  getStudyLogs(@CurrentUser() user: AuthUser, @Query('limit') limit?: string) {
    const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10) || 0, 1), 365) : 100;
    return this.curriculumService.getStudyLogs(user.id, parsedLimit);
  }

  @Get('today')
  getTodayPlan(
    @CurrentUser() user: AuthUser,
    @Query('topic') topic?: string,
    @Query('level') level?: string,
  ) {
    return this.curriculumService.getTodayPlan(user.id, topic, level);
  }

  @Throttle({ default: { limit: 25, ttl: 60_000 } })
  @Post('topic-dialogue')
  generateTopicDialogue(
    @CurrentUser() user: AuthUser,
    @Body() body: ChineseTopicDialogueDto,
  ) {
    return this.curriculumService.generateTopicDialogue(user.id, body);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateStudyProfileDto,
  ) {
    return this.curriculumService.updateProfile(user.id, body);
  }

  @Post('srs-review')
  submitSrsReview(
    @CurrentUser() user: AuthUser,
    @Body() body: ChineseSrsReviewDto,
  ) {
    return this.curriculumService.submitSrsReview(user.id, body.vocabularyId, body.quality);
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('word-deep-dive')
  getWordDeepDive(
    @CurrentUser() user: AuthUser,
    @Body() body: ChineseWordDeepDiveDto,
  ) {
    return this.curriculumService.getWordDeepDive(user.id, body.vocabularyId, body.model);
  }

  @Throttle({ default: { limit: 25, ttl: 60_000 } })
  @Post('mixed-practice')
  generateMixedPractice(
    @CurrentUser() user: AuthUser,
    @Body() body: ChineseMixedPracticeDto,
  ) {
    return this.curriculumService.generateMixedPractice(user.id, body);
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('evaluate')
  evaluateAttempt(
    @CurrentUser() user: AuthUser,
    @Body() body: ChineseEvaluateAttemptDto,
  ) {
    return this.curriculumService.evaluateAttempt(user.id, body);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('evaluate-batch')
  evaluateBatch(
    @CurrentUser() user: AuthUser,
    @Body() body: ChineseEvaluateBatchDto,
  ) {
    return this.curriculumService.evaluateBatch(user.id, body);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('complete-day')
  completeDailySession(
    @CurrentUser() user: AuthUser,
    @Body() body: ChineseCompleteDayDto,
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
    @Body() body: UpdateGrammarStatusDto,
  ) {
    return this.curriculumService.updateGrammarStatus(user.id, id, body.status);
  }
}
