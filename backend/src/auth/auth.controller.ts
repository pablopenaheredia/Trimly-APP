import {
  Body,
  Controller,
  Get,
  Headers,
  UnauthorizedException,
  Post,
} from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('validate')
  async validate(@Headers('authorization') authorization?: string) {
    const token = this.extractBearerToken(authorization);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    await this.authService.verifyToken(token);
    return { valid: true };
  }

  private extractBearerToken(authorization?: string): string | null {
    if (!authorization) return null;
    const [scheme, token] = authorization.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
    return token;
  }
}
