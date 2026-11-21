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
import { Throttle } from '@nestjs/throttler';
import { VocabularyService } from './vocabulary.service';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { BulkPasteDto, BulkVocabularyDto } from './dto/bulk-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

const MAX_CSV_BYTES = 2 * 1024 * 1024; // 2MB

@UseGuards(JwtAuthGuard)
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  /**
   * GET /vocabulary - Lấy danh sách từ vựng (hỗ trợ phân trang, lite mode và random pool cho Mini-Game)
   */
  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('search') search?: string,
    @Query('level') level?: string,
    @Query('partOfSpeech') partOfSpeech?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('lite') lite?: string,
    @Query('random') random?: string,
  ) {
    const parsedPage = page ? Math.max(parseInt(page, 10) || 1, 1) : undefined;
    const parsedLimit = limit
      ? Math.min(Math.max(parseInt(limit, 10) || 50, 1), 1000)
      : undefined;

    return this.vocabularyService.findAll(user.id, search, level, partOfSpeech, {
      page: parsedPage,
      limit: parsedLimit,
      lite: lite === 'true',
      random: random === 'true',
    });
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
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
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
   * POST /vocabulary/import - Import file CSV (tối đa 2MB) hoặc gửi chuỗi CSV
   */
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_CSV_BYTES },
      fileFilter: (_req, file, cb) => {
        const lowerName = (file.originalname || '').toLowerCase();
        const isCsv =
          lowerName.endsWith('.csv') ||
          lowerName.endsWith('.txt') ||
          file.mimetype === 'text/csv' ||
          file.mimetype === 'application/vnd.ms-excel' ||
          file.mimetype === 'text/plain';
        if (!isCsv) {
          return cb(new BadRequestException('Chỉ chấp nhận file định dạng .csv hoặc .txt.'), false);
        }
        cb(null, true);
      },
    }),
  )
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
      if (Buffer.byteLength(csvContent, 'utf8') > MAX_CSV_BYTES) {
        throw new BadRequestException('Nội dung CSV vượt quá giới hạn 2MB.');
      }
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
