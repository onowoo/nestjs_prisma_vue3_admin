import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  CustomException,
  ErrorCode,
} from '@/common/exceptions/custom.exception';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { UserService } from '@/user/user.service';
import * as bcrypt from 'bcryptjs';
import { RedisService } from '@/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async validateUser(
    username: string,
    password: string,
    email?: string,
    event?: 'login' | 'register',
  ): Promise<any> {
    // 如果是登录验证
    if (event === 'login') {
      const user = await this.userService.findByUsername(username);
      if (!user) {
        throw new UnauthorizedException('用户不存在'); // 用户不存在
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('密码不正确'); // 密码不正确
      }
      return user; // 返回用户信息
    }

    // 如果是注册验证
    if (event === 'register') {
      const existingUser = await this.userService.findByUsername(username);
      if (existingUser) {
        throw new CustomException(ErrorCode.ERR_10001); // 用户名已存在
      }

      // const existingEmail = await this.usersService.findByEmail(email);
      // if (existingEmail) {
      //   throw new ConflictException('邮箱已被使用'); // 邮箱已被使用
      // }
    }

    return null; // 如果没有提供有效的 event，返回 null
  }

  validateCaptcha(input: string, session: any): boolean {
    return input.toLowerCase() === session.code.toLowerCase(); // 从会话中获取并验证
  }

  async login(loginDto: LoginDto, clientIp: string) {
    const { username, password, captcha } = loginDto;

    // 验证验证码
    const savedCaptcha = await this.redisService.get(`captcha:${clientIp}`);
    if (!savedCaptcha || savedCaptcha !== captcha.toLowerCase()) {
      throw new UnauthorizedException('验证码错误或已过期');
    }

    // 使用 findByUsername 方法查找用户
    const user = await this.userService.findByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!user.enable) {
      throw new UnauthorizedException('用户已被禁用');
    }

    // 删除已使用的验证码
    await this.redisService.del(`captcha:${clientIp}`);

    // 生成用户的角色和权限信息
    const currentRole = user.roles[0];
    const userInfo = {
      id: user.id,
      username: user.username,
      roles: user.roles,
      currentRole,
    };

    // 将用户信息存储到 Redis，用于角色切换
    await this.redisService.set(
      `user:${user.id}`,
      JSON.stringify(userInfo),
      24 * 60 * 60 // 24小时过期
    );

    const token = this.generateToken(user.id, currentRole.code);

    return {
      code: 200,
      data: {
        accessToken: token,
        userInfo,
      },
      message: '登录成功',
    };
  }

  async switchRole(userId: number, roleCode: string) {
    try {
      // 从数据库获取用户及其角色信息
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            where: { enable: true }, // 只获取启用的角色
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      // 检查用户是否有权限切换到目标角色
      const targetRole = user.roles.find(role => role.code === roleCode);
      if (!targetRole) {
        throw new UnauthorizedException('无权限切换到目标角色');
      }

      // 更新 Redis 中的用户信息
      const userInfo = {
        id: user.id,
        username: user.username,
        roles: user.roles,
        currentRole: targetRole,
      };

      await this.redisService.set(
        `user:${userId}`,
        JSON.stringify(userInfo),
        24 * 60 * 60 // 24小时过期
      );

      // 生成新的 token
      const token = this.generateToken(userId, roleCode);

      return {
        code: 200,
        data: {
          accessToken: token,
          userInfo,
        },
        message: '切换角色成功',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('角色切换失败');
    }
  }

  private generateToken(userId: number, roleCode: string): string {
    return this.jwtService.sign({
      sub: userId,
      roleCode,
    });
  }

  async logout(userId: number) {
    // 这里可以添加token黑名单等逻辑
    return true;
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      include: {
        profile: true,
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return user;
  }
}
