import { Controller, Get, Post, Patch, Put, Body, Param, Delete } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { GeneratePracticeDto } from './dto/generate-practice.dto';
import { UpdatePracticeDto } from './dto/update-practice.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AutoCompleteSentenceDto } from './dto/auto-complete-sentence.dto';

@Controller('practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  /**
   * POST /practice/generate - Yêu cầu AI sinh bài tập mới
   */
  @Post('generate')
  generate(@Body() generateDto: GeneratePracticeDto) {
    return this.practiceService.generatePractice(generateDto);
  }

  /**
   * POST /practice/auto-complete-sentence - Tự động gen Pinyin & dịch Tiếng Việt từ câu tiếng Trung (hoặc ngược lại)
   */
  @Post('auto-complete-sentence')
  autoCompleteSentence(@Body() dto: AutoCompleteSentenceDto) {
    return this.practiceService.autoCompleteSentence(dto);
  }

  /**
   * POST /practice/:id/questions - Thêm câu hỏi mới vào bài tập
   */
  @Post(':id/questions')
  addQuestion(@Param('id') id: string, @Body() dto: CreateQuestionDto) {
    return this.practiceService.addQuestion(id, dto);
  }

  /**
   * PATCH /practice/questions/:questionId - Cập nhật nội dung một câu hỏi
   */
  @Patch('questions/:questionId')
  updateQuestion(@Param('questionId') questionId: string, @Body() dto: UpdateQuestionDto) {
    return this.practiceService.updateQuestion(questionId, dto);
  }

  /**
   * PUT /practice/questions/:questionId - Cập nhật nội dung câu hỏi (hỗ trợ cả PUT)
   */
  @Put('questions/:questionId')
  updateQuestionPut(@Param('questionId') questionId: string, @Body() dto: UpdateQuestionDto) {
    return this.practiceService.updateQuestion(questionId, dto);
  }

  /**
   * DELETE /practice/questions/:questionId - Xóa một câu hỏi khỏi bài tập
   */
  @Delete('questions/:questionId')
  deleteQuestion(@Param('questionId') questionId: string) {
    return this.practiceService.deleteQuestion(questionId);
  }

  /**
   * PATCH /practice/:id/questions/:questionId - Alias cập nhật câu hỏi theo practiceSetId
   */
  @Patch(':id/questions/:questionId')
  updateQuestionScoped(@Param('questionId') questionId: string, @Body() dto: UpdateQuestionDto) {
    return this.practiceService.updateQuestion(questionId, dto);
  }

  /**
   * DELETE /practice/:id/questions/:questionId - Alias xóa câu hỏi theo practiceSetId
   */
  @Delete(':id/questions/:questionId')
  deleteQuestionScoped(@Param('questionId') questionId: string) {
    return this.practiceService.deleteQuestion(questionId);
  }

  /**
   * GET /practice - Lấy danh sách bài tập đã tạo (Practice History)
   */
  @Get()
  findAll() {
    return this.practiceService.findAll();
  }

  /**
   * GET /practice/stats/dashboard - Lấy dữ liệu thống kê cho Dashboard trang chủ
   */
  @Get('stats/dashboard')
  getDashboardStats() {
    return this.practiceService.getDashboardStats();
  }

  /**
   * GET /practice/:id - Lấy chi tiết bộ bài tập và câu hỏi
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.practiceService.findOne(id);
  }

  /**
   * PATCH /practice/:id - Cập nhật tiêu đề hoặc mô tả bài tập
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdatePracticeDto) {
    return this.practiceService.update(id, updateDto);
  }

  /**
   * PUT /practice/:id - Cập nhật tiêu đề hoặc mô tả bài tập (hỗ trợ cả PUT)
   */
  @Put(':id')
  updatePut(@Param('id') id: string, @Body() updateDto: UpdatePracticeDto) {
    return this.practiceService.update(id, updateDto);
  }

  /**
   * DELETE /practice/:id - Xóa bài tập
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.practiceService.remove(id);
  }
}
