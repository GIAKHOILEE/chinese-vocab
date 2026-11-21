import { Controller, Get, Post, Patch, Put, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PracticeService } from './practice.service';
import { GeneratePracticeDto } from './dto/generate-practice.dto';
import { UpdatePracticeDto } from './dto/update-practice.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AutoCompleteSentenceDto } from './dto/auto-complete-sentence.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Post('generate')
  generate(@CurrentUser() user: AuthUser, @Body() generateDto: GeneratePracticeDto) {
    return this.practiceService.generatePractice(user.id, generateDto);
  }

  @Throttle({ default: { limit: 25, ttl: 60_000 } })
  @Post('auto-complete-sentence')
  autoCompleteSentence(@Body() dto: AutoCompleteSentenceDto) {
    return this.practiceService.autoCompleteSentence(dto);
  }

  @Post(':id/questions')
  addQuestion(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.practiceService.addQuestion(user.id, id, dto);
  }

  @Patch('questions/:questionId')
  updateQuestion(
    @CurrentUser() user: AuthUser,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.practiceService.updateQuestion(user.id, questionId, dto);
  }

  @Put('questions/:questionId')
  updateQuestionPut(
    @CurrentUser() user: AuthUser,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.practiceService.updateQuestion(user.id, questionId, dto);
  }

  @Delete('questions/:questionId')
  deleteQuestion(@CurrentUser() user: AuthUser, @Param('questionId') questionId: string) {
    return this.practiceService.deleteQuestion(user.id, questionId);
  }

  @Patch(':id/questions/:questionId')
  updateQuestionScoped(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.practiceService.updateQuestion(user.id, questionId, dto, id);
  }

  @Delete(':id/questions/:questionId')
  deleteQuestionScoped(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('questionId') questionId: string,
  ) {
    return this.practiceService.deleteQuestion(user.id, questionId, id);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.practiceService.findAll(user.id);
  }

  @Get('stats/dashboard')
  getDashboardStats(@CurrentUser() user: AuthUser) {
    return this.practiceService.getDashboardStats(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.practiceService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() updateDto: UpdatePracticeDto,
  ) {
    return this.practiceService.update(user.id, id, updateDto);
  }

  @Put(':id')
  updatePut(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() updateDto: UpdatePracticeDto,
  ) {
    return this.practiceService.update(user.id, id, updateDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.practiceService.remove(user.id, id);
  }
}
