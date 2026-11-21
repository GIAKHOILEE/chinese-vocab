import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from './current-user.decorator';

interface CachedUserEntry {
  user: AuthUser;
  tokenVersion: number;
  expiresAt: number;
}

const AUTH_CACHE_TTL_MS = 30_000;
const AUTH_CACHE_MAX_SIZE = 5_000;
const userAuthCache = new Map<string, CachedUserEntry>();

export function invalidateUserAuthCache(userId: string): void {
  userAuthCache.delete(userId);
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Vui lòng đăng nhập để truy cập dữ liệu học tập của bạn.');
    }

    const token = authHeader.slice(7).trim();
    if (!token || token.length > 2048) {
      throw new UnauthorizedException('Token xác thực không hợp lệ.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        username: string;
        tv?: number;
      }>(token);

      if (!payload?.sub) {
        throw new UnauthorizedException('Token xác thực không hợp lệ.');
      }

      const now = Date.now();
      let cached = userAuthCache.get(payload.sub);

      if (!cached || cached.expiresAt <= now) {
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, username: true, displayName: true, role: true, tokenVersion: true },
        });

        if (!user) {
          userAuthCache.delete(payload.sub);
          throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị xóa.');
        }

        if (userAuthCache.size >= AUTH_CACHE_MAX_SIZE) {
          const oldestKey = userAuthCache.keys().next().value;
          if (oldestKey) userAuthCache.delete(oldestKey);
        }

        cached = {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
          },
          tokenVersion: user.tokenVersion,
          expiresAt: now + AUTH_CACHE_TTL_MS,
        };
        userAuthCache.set(payload.sub, cached);
      }

      // Thu hồi toàn bộ token cũ ngay khi đổi mật khẩu hoặc bấm đăng xuất tất cả thiết bị
      if (typeof payload.tv === 'number' && payload.tv !== cached.tokenVersion) {
        throw new UnauthorizedException('Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.');
      }

      request.user = cached.user;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
    }
  }
}
