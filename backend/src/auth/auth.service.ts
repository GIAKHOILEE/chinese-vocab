import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, UpdateProfileAccountDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private signToken(user: { id: string; username: string; role: string }) {
    return this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
  }

  private sanitizeUser(user: {
    id: string;
    username: string;
    email: string | null;
    displayName: string;
    role: string;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async register(dto: RegisterDto) {
    const username = dto.username.trim().toLowerCase();
    const email = dto.email ? dto.email.trim().toLowerCase() : null;
    const displayName = dto.displayName?.trim() || dto.username.trim();

    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new BadRequestException(`Tên đăng nhập "${username}" đã được sử dụng.`);
    }

    if (email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new BadRequestException(`Email "${email}" đã được đăng ký.`);
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username,
          email,
          passwordHash,
          displayName,
          role: 'USER',
        },
      });

      await tx.studyProfile.create({
        data: {
          userId: created.id,
          currentLevel: 'HSK1',
          dailyMinutesTarget: 90,
          newWordsPerDay: 15,
          reviewWordsPerDay: 25,
          grammarPerDay: 1,
          preferredModel: 'gemini-3-flash-preview',
          currentDayNumber: 1,
        },
      });

      await tx.englishProfile.create({
        data: {
          userId: created.id,
          currentLevel: 'A1',
          placementDone: false,
          dailyMinutesTarget: 60,
          newWordsPerDay: 12,
          reviewWordsPerDay: 20,
          grammarPerDay: 1,
          preferredModel: 'gemini-3-flash-preview',
          currentDayNumber: 1,
        },
      });

      return created;
    });

    const accessToken = this.signToken(user);
    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  async login(dto: LoginDto) {
    const identifier = dto.username.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Sai tên đăng nhập hoặc mật khẩu.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Sai tên đăng nhập hoặc mật khẩu.');
    }

    const accessToken = this.signToken(user);
    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
        studyProfile: true,
        englishProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy tài khoản.');
    }

    const [zhMastered, zhLearning, enMastered, enLearning] = await Promise.all([
      this.prisma.vocabProgress.count({ where: { userId, status: 'mastered' } }),
      this.prisma.vocabProgress.count({ where: { userId, status: { in: ['learning', 'review'] } } }),
      this.prisma.englishVocabProgress.count({ where: { userId, status: 'mastered' } }),
      this.prisma.englishVocabProgress.count({ where: { userId, status: { in: ['learning', 'review'] } } }),
    ]);

    return {
      ...user,
      progressOverview: {
        chinese: { mastered: zhMastered, active: zhLearning },
        english: { mastered: enMastered, active: enLearning },
      },
    };
  }

  async updateMe(userId: string, dto: UpdateProfileAccountDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy tài khoản.');
    }

    const data: any = {};
    if (dto.displayName !== undefined) {
      data.displayName = dto.displayName.trim();
    }
    if (dto.email !== undefined) {
      const nextEmail = dto.email.trim().toLowerCase();
      if (nextEmail !== user.email) {
        const dup = await this.prisma.user.findUnique({ where: { email: nextEmail } });
        if (dup && dup.id !== userId) {
          throw new BadRequestException(`Email "${nextEmail}" đã được sử dụng.`);
        }
        data.email = nextEmail;
      }
    }
    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu.');
      }
      const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!valid) {
        throw new BadRequestException('Mật khẩu hiện tại không chính xác.');
      }
      data.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.sanitizeUser(updated);
  }
}
