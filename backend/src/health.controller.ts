import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller()
export class HealthController {
  @Get()
  root() {
    return { status: 'ok', service: 'chinese-vocab-backend' };
  }

  @Get('health')
  health() {
    return { status: 'ok', uptime: Math.round(process.uptime()) };
  }
}
