import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { AssignUsersDto } from './dto/assign-users.dto';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      where: { enable: true },
      select: {
        id: true,
        code: true,
        name: true,
        enable: true,
      },
    });
  }

  async findAllPaginated(query: QueryRoleDto) {
    const { name, pageNo, pageSize } = query;
    const skip = (pageNo - 1) * Number(pageSize);

    const where = {
      ...(name && { name: { contains: name } }),
    };

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        include: {
          permissions: {
            select: {
              id: true,
            },
          },
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    const pageData = roles.map(role => ({
      ...role,
      permissionIds: role.permissions.map(p => p.id),
    }));

    return {
      pageData,
      total,
    };
  }

  async create(createRoleDto: CreateRoleDto) {
    const { code, name, permissionIds, ...rest } = createRoleDto;

    // Check if role code already exists
    const existingRole = await this.prisma.role.findFirst({
      where: { OR: [{ code }, { name }] },
    });

    if (existingRole) {
      throw new ConflictException('Role code or name already exists');
    }

    return this.prisma.role.create({
      data: {
        code,
        name,
        ...rest,
        permissions: {
          connect: permissionIds.map(id => ({ id })),
        },
      },
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const { permissionIds, ...updateData } = updateRoleDto;

    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check if new code/name conflicts with existing roles
    if (updateData.code || updateData.name) {
      const existingRole = await this.prisma.role.findFirst({
        where: {
          OR: [
            updateData.code && { code: updateData.code },
            updateData.name && { name: updateData.name },
          ].filter(Boolean),
          NOT: { id },
        },
      });

      if (existingRole) {
        throw new ConflictException('Role code or name already exists');
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        ...updateData,
        ...(permissionIds && {
          permissions: {
            set: permissionIds.map(id => ({ id })),
          },
        }),
      },
    });
  }

  async remove(id: number) {
    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    if (role.users.length > 0) {
      throw new ConflictException('Cannot delete role with assigned users');
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return true;
  }

  async assignUsers(id: number, { userIds }: AssignUsersDto) {
    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    await this.prisma.role.update({
      where: { id },
      data: {
        users: {
          connect: userIds.map(id => ({ id })),
        },
      },
    });

    return true;
  }

  async removeUsers(id: number, { userIds }: AssignUsersDto) {
    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    await this.prisma.role.update({
      where: { id },
      data: {
        users: {
          disconnect: userIds.map(id => ({ id })),
        },
      },
    });

    return true;
  }

  async findRolePermissions(roleId: number) {
    // 获取角色的权限
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true },
    });

    // 获取所有权限
    const permissions = await this.prisma.permission.findMany({
      where: {
        enable: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    // 如果角色没有权限，返回所有权限的树形结构
    if (!role || role.permissions.length === 0) {
      return this.buildTree(permissions);
    }

    // 构建角色权限的树形结构
    return this.buildTree(role.permissions);
  }

  private buildTree(permissions: any[], parentId: number | null = null): any[] {
    return permissions
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: this.buildTree(permissions, item.id),
      }))
      .filter(item => item.children.length > 0 || item.type === 'MENU');
  }
}
