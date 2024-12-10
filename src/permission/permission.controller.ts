import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('权限')
@UseGuards(JwtAuthGuard)
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get('tree')
  @ApiOperation({ summary: '权限树-all' })
  async findAllTree() {
    const data = await this.permissionService.findAllTree();
    return {
      code: 200,
      message: '获取成功',
      data,
      originUrl: null,
    };
  }

  @Get('menu/tree')
  @ApiOperation({ summary: '权限树-菜单' })
  async findMenuTree() {
    const data = await this.permissionService.findMenuTree();
    return {
      code: 200,
      message: '获取成功',
      data,
      originUrl: null,
    };
  }

  @Get('button/:parentId')
  @ApiOperation({ summary: '按钮权限-by parentId' })
  async findButtonsByParentId(@Param('parentId', ParseIntPipe) parentId: number) {
    const data = await this.permissionService.findButtonsByParentId(parentId);
    return {
      code: 200,
      message: '获取成功',
      data,
      originUrl: null,
    };
  }

  @Post()
  @ApiOperation({ summary: '新增权限' })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    const data = await this.permissionService.create(createPermissionDto);
    return {
      code: 200,
      message: '创建成功',
      data,
      originUrl: null,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改权限' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    const data = await this.permissionService.update(id, updatePermissionDto);
    return {
      code: 200,
      message: '更新成功',
      data,
      originUrl: null,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除权限' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.permissionService.remove(id);
    return {
      code: 200,
      message: '删除成功',
      data,
      originUrl: null,
    };
  }
} 