import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Khi module được khởi tạo, tự động kết nối cơ sở dữ liệu
  async onModuleInit() {
    await this.$connect();
  }

  // Khi ứng dụng đóng, tự động ngắt kết nối
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
