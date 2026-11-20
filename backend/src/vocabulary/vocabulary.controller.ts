import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VocabularyService } from './vocabulary.service';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { BulkPasteDto, BulkVocabularyDto } from './dto/bulk-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  /**
   * GET /vocabulary - Lấy danh sách từ vựng (kho chuẩn chung + từ cá nhân của user)
   */
  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('search') search?: string,
    @Query('level') level?: string,
    @Query('partOfSpeech') partOfSpeech?: string,
  ) {
    return this.vocabularyService.findAll(user.id, search, level, partOfSpeech);
  }

  /**
   * GET /vocabulary/:id - Lấy chi tiết một từ vựng
   */
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vocabularyService.findOne(user.id, id);
  }

  /**
   * POST /vocabulary - Thêm 1 từ vựng thủ công (thuộc về user hiện tại)
   */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() createDto: CreateVocabularyDto) {
    return this.vocabularyService.create(user.id, createDto);
  }

  /**
   * POST /vocabulary/bulk - Nhập danh sách từ vựng dạng paste nhiều dòng hoặc mảng items
   */
  @Post('bulk')
  bulk(@CurrentUser() user: AuthUser, @Body() body: BulkPasteDto | BulkVocabularyDto) {
    if ('text' in body) {
      return this.vocabularyService.bulkPaste(user.id, body as BulkPasteDto);
    } else if ('items' in body) {
      return this.vocabularyService.bulkInsert(user.id, body as BulkVocabularyDto);
    }
    throw new BadRequestException('Dữ liệu nhập hàng loạt không hợp lệ');
  }

  /**
   * POST /vocabulary/import - Import file CSV hoặc gửi chuỗi CSV
   */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importCsv(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
    @Body('csvContent') csvContent?: string,
  ) {
    if (file) {
      const content = file.buffer.toString('utf-8');
      return this.vocabularyService.importCsv(user.id, content);
    }
    if (csvContent) {
      return this.vocabularyService.importCsv(user.id, csvContent);
    }
    throw new BadRequestException('Vui lòng tải lên file CSV hoặc truyền dữ liệu csvContent');
  }

  /**
   * PATCH /vocabulary/:id - Cập nhật từ vựng (chỉ từ cá nhân hoặc ADMIN)
   */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateVocabularyDto,
  ) {
    return this.vocabularyService.update(user, id, updateDto);
  }

  /**
   * DELETE /vocabulary/:id - Xóa một từ vựng (chỉ từ cá nhân hoặc ADMIN)
   */
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vocabularyService.remove(user, id);
  }
}
