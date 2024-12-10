import { Controller, Post, Body, Req, Res, Get, UseGuards, Param, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RedisService } from '../redis/redis.service';
import * as svgCaptcha from 'svg-captcha';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
  ) {}

  @Get('captcha')
  async createCaptcha(@Req() req: any, @Res() res: any) {
    const captcha = svgCaptcha.create({
      size: 4,
      fontSize: 40,
      width: 80,
      height: 40,
      background: '#fff',
      color: true,
    });

    // 使用用户的 IP 地址作为键存储验证码
    const clientIp = req.ip;
    await this.redisService.set(`captcha:${clientIp}`, captcha.text.toLowerCase(), 300);

    res.type('image/svg+xml');
    res.send(captcha.data);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const clientIp = req.ip;
    const data = await this.authService.login(loginDto, clientIp);
    return data;
  }

  @Post('current-role/switch/:roleCode')
  @ApiOperation({ summary: '切换角色' })
  @UseGuards(JwtAuthGuard)
  async switchRole(
    @Req() req,
    @Param('roleCode') roleCode: string,
  ) {
    try {
      return await this.authService.switchRole(req.user.sub, roleCode);
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req) {
    const data = await this.authService.logout(req.user.id);
    return {
      code: 200,
      message: '退出成功',
      data,
      originUrl: null,
    };
  }
} 