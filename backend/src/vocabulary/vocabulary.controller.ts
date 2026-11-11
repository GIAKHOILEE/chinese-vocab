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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VocabularyService } from './vocabulary.service';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { BulkPasteDto, BulkVocabularyDto } from './dto/bulk-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';

@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  /**
   * GET /vocabulary - Lấy danh sách từ vựng (hỗ trợ search và level)
   */
  @Get()
  findAll(@Query('search') search?: string, @Query('level') level?: string) {
    return this.vocabularyService.findAll(search, level);
  }

  /**
   * GET /vocabulary/:id - Lấy chi tiết một từ vựng
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vocabularyService.findOne(id);
  }

  /**
   * POST /vocabulary - Thêm 1 từ vựng thủ công
   */
  @Post()
  create(@Body() createDto: CreateVocabularyDto) {
    return this.vocabularyService.create(createDto);
  }

  /**
   * POST /vocabulary/bulk - Nhập danh sách từ vựng dạng paste nhiều dòng hoặc mảng items
   */
  @Post('bulk')
  bulk(@Body() body: BulkPasteDto | BulkVocabularyDto) {
    if ('text' in body) {
      return this.vocabularyService.bulkPaste(body as BulkPasteDto);
    } else if ('items' in body) {
      return this.vocabularyService.bulkInsert(body as BulkVocabularyDto);
    }
    throw new BadRequestException('Dữ liệu nhập hàng loạt không hợp lệ');
  }

  /**
   * POST /vocabulary/import - Import file CSV hoặc gửi chuỗi CSV
   */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importCsv(
    @UploadedFile() file?: Express.Multer.File,
    @Body('csvContent') csvContent?: string,
  ) {
    if (file) {
      const content = file.buffer.toString('utf-8');
      return this.vocabularyService.importCsv(content);
    }
    if (csvContent) {
      return this.vocabularyService.importCsv(csvContent);
    }
    throw new BadRequestException('Vui lòng tải lên file CSV hoặc truyền dữ liệu csvContent');
  }

  /**
   * PATCH /vocabulary/:id - Cập nhật từ vựng
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateVocabularyDto,
  ) {
    return this.vocabularyService.update(id, updateDto);
  }

  /**
   * DELETE /vocabulary/:id - Xóa một từ vựng
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vocabularyService.remove(id);
  }
}
