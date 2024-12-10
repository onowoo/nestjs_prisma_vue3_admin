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
  NotFoundException,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { AssignUsersDto } from './dto/assign-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RedisService } from '../redis/redis.service';

@ApiTags('角色')
@UseGuards(JwtAuthGuard)
@Controller('role')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: '角色列表-all' })
  async findAll() {
    const data = await this.roleService.findAll();
    return {
      code: 200,
      message: '获取成功',
      data,
      originUrl: null,
    };
  }

  @Get('page')
  @ApiOperation({ summary: '角色列表-分页' })
  async findAllPaginated(@Query() query: QueryRoleDto) {
    const data = await this.roleService.findAllPaginated(query);
    return {
      code: 200,
      message: '获取成功',
      data,
      originUrl: null,
    };
  }

  @Post()
  @ApiOperation({ summary: '新增角色' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    const data = await this.roleService.create(createRoleDto);
    return {
      code: 200,
      message: '创建成功',
      data,
      originUrl: null,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改角色' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const data = await this.roleService.update(id, updateRoleDto);
    return {
      code: 200,
      message: '更新成功',
      data,
      originUrl: null,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.roleService.remove(id);
    return {
      code: 200,
      message: '删除成功',
      data,
      originUrl: null,
    };
  }

  @Patch('users/add/:id')
  @ApiOperation({ summary: '分配角色-批量' })
  async assignUsers(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignUsersDto: AssignUsersDto,
  ) {
    const data = await this.roleService.assignUsers(id, assignUsersDto);
    return {
      code: 200,
      message: '分配成功',
      data,
      originUrl: null,
    };
  }

  @Patch('users/remove/:id')
  @ApiOperation({ summary: '取消分配角色-批量' })
  async removeUsers(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignUsersDto: AssignUsersDto,
  ) {
    const data = await this.roleService.removeUsers(id, assignUsersDto);
    return {
      code: 200,
      message: '取消分配成功',
      data,
      originUrl: null,
    };
  }

  @Get('permissions/tree')
  @ApiOperation({ summary: '获取权限树' })
  async getRolePermissions() {
    const roleId = await this.redisService.get('currentRoleId');

    if (!roleId) {
      throw new NotFoundException('角色 ID 未找到');
    }

    const data = await this.roleService.findRolePermissions(Number(roleId));
    return {
      code: 200,
      message: '获取成功',
      data,
      originUrl: null,
    };
  }
} 