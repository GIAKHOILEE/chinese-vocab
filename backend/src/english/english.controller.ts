import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EnglishService } from './english.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import {
  EnglishCompleteDayDto,
  EnglishEvaluateAttemptDto,
  EnglishEvaluateBatchDto,
  EnglishMixedPracticeDto,
  EnglishSrsReviewDto,
  EnglishTopicDialogueDto,
  EnglishWordDeepDiveDto,
  SubmitPlacementTestDto,
  UpdateEnglishProfileDto,
} from './dto/english.dto';
import { UpdateGrammarStatusDto } from '../curriculum/dto/curriculum.dto';

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
    @Body() body: UpdateEnglishProfileDto,
  ) {
    return this.englishService.updateProfile(user.id, body);
  }

  @Get('placement-test')
  getPlacementTest() {
    return this.englishService.getPlacementTest();
  }

  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Post('placement-submit')
  submitPlacementTest(
    @CurrentUser() user: AuthUser,
    @Body() body: SubmitPlacementTestDto,
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
    @Body() body: EnglishSrsReviewDto,
  ) {
    return this.englishService.submitSrsReview(user.id, body.id, body.quality);
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('word-deep-dive')
  getWordDeepDive(
    @CurrentUser() user: AuthUser,
    @Body() body: EnglishWordDeepDiveDto,
  ) {
    return this.englishService.getWordDeepDive(user.id, body.id, body.model);
  }

  @Throttle({ default: { limit: 25, ttl: 60_000 } })
  @Post('topic-dialogue')
  generateTopicDialogue(
    @CurrentUser() user: AuthUser,
    @Body() body: EnglishTopicDialogueDto,
  ) {
    return this.englishService.generateTopicDialogue(user.id, body);
  }

  @Throttle({ default: { limit: 25, ttl: 60_000 } })
  @Post('mixed-practice')
  generateMixedPractice(
    @CurrentUser() user: AuthUser,
    @Body() body: EnglishMixedPracticeDto,
  ) {
    return this.englishService.generateMixedPractice(user.id, body);
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('evaluate')
  evaluateAttempt(@Body() body: EnglishEvaluateAttemptDto) {
    return this.englishService.evaluateAttempt(body);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('evaluate-batch')
  evaluateBatch(@Body() body: EnglishEvaluateBatchDto) {
    return this.englishService.evaluateBatch(body);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('complete-day')
  completeDailySession(
    @CurrentUser() user: AuthUser,
    @Body() body: EnglishCompleteDayDto,
  ) {
    return this.englishService.completeDailySession(user.id, body);
  }

  @Get('vocab')
  getVocabList(
    @CurrentUser() user: AuthUser,
    @Query('level') level?: string,
    @Query('lite') lite?: string,
    @Query('random') random?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10) || 0, 1), 1000) : undefined;
    return this.englishService.getVocabList(user.id, level, {
      lite: lite === 'true',
      random: random === 'true',
      limit: parsedLimit,
    });
  }

  @Get('grammar')
  getGrammarList(@CurrentUser() user: AuthUser, @Query('level') level?: string) {
    return this.englishService.getGrammarList(user.id, level);
  }

  @Patch('grammar/:id/status')
  updateGrammarStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateGrammarStatusDto,
  ) {
    return this.englishService.updateGrammarStatus(user.id, id, body.status);
  }
}
