import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, UpdateProfileAccountDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthUser, CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileAccountDto) {
    return this.authService.updateMe(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  logoutAllSessions(@CurrentUser() user: AuthUser) {
    return this.authService.logoutAllSessions(user.id);
  }
}
