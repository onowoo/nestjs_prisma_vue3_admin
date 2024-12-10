import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { RedisService } from '../redis/redis.service';

@ApiTags('用户')
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {}

  @Get('detail')
  @ApiOperation({ summary: '获取当前用户信息' })
  async findCurrentUser(@Req() req) {
    const userId = req.user.sub;
    if (!userId) {
      throw new Error('User ID not found in token');
    }

    const user = await this.userService.findOne(Number(userId));

    // 从 Redis 获取当前角色信息
    const userInfoStr = await this.redisService.get(`user:${userId}`);
    if (!userInfoStr) {
      throw new Error('User information not found in Redis');
    }
    const userInfo = JSON.parse(userInfoStr);
    const currentRole = userInfo.currentRole;

    // 构建响应对象
    const response = {
      code: 0,
      message: 'OK',
      data: {
        id: user.id,
        username: user.username,
        enable: user.enable,
        createTime: user.createTime,
        updateTime: user.updateTime,
        profile: {
          id: user.profile.id,
          nickName: user.profile.nickName,
          gender: user.profile.gender,
          avatar: user.profile.avatar,
          address: user.profile.address,
          email: user.profile.email,
          userId: user.profile.userId,
        },
        roles: user.roles.map(role => ({
          id: role.id,
          code: role.code,
          name: role.name,
          enable: role.enable,
        })),
        currentRole: {
          id: currentRole.id,
          code: currentRole.code,
          name: currentRole.name,
          enable: currentRole.enable,
        },
      },
      originUrl: '/user/detail',
    };

    return response;
  }

  @Get()
  @ApiOperation({ summary: '用户列表-分页' })
  async findAll(@Query() query: QueryUserDto) {
    const data = await this.userService.findAll(query);
    return {
      code: 200,
      message: '获取成功',
      data,
      originUrl: null,
    };
  }

  @Post()
  @ApiOperation({ summary: '新增用户' })
  async create(@Body() createUserDto: CreateUserDto) {
    const data = await this.userService.create(createUserDto);
    return {
      code: 200,
      message: '创建成功',
      data,
      originUrl: null,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改用户' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const data = await this.userService.update(id, updateUserDto);
    return {
      code: 200,
      message: '更新成功',
      data,
      originUrl: null,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.userService.remove(id);
    return {
      code: 200,
      message: '删除成功',
      data,
      originUrl: null,
    };
  }

  @Patch('password/reset/:id')
  @ApiOperation({ summary: '重置用户密码' })
  async resetPassword(@Param('id', ParseIntPipe) id: number) {
    const data = await this.userService.resetPassword(id);
    return {
      code: 200,
      message: '密码重置成功',
      data,
      originUrl: null,
    };
  }
} 