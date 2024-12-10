import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto, PermissionType } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  private async buildPermissionTree(permissions: any[]) {
    const permissionMap = new Map();
    const roots = [];

    // First pass: Create map of all permissions
    permissions.forEach(permission => {
      permissionMap.set(permission.id, { ...permission, children: [] });
    });

    // Second pass: Build tree structure
    permissions.forEach(permission => {
      const node = permissionMap.get(permission.id);
      if (permission.parentId === null) {
        roots.push(node);
      } else {
        const parent = permissionMap.get(permission.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    return roots;
  }

  async findAllTree() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: { order: 'asc' },
    });

    return this.buildPermissionTree(permissions);
  }

  async findMenuTree() {
    const permissions = await this.prisma.permission.findMany({
      where: {
        type: PermissionType.MENU,
      },
      orderBy: { order: 'asc' },
    });

    return this.buildPermissionTree(permissions);
  }

  async findButtonsByParentId(parentId: number) {
    return this.prisma.permission.findMany({
      where: {
        parentId,
        type: PermissionType.BUTTON,
      },
      orderBy: { order: 'asc' },
    });
  }

  async create(createPermissionDto: CreatePermissionDto) {
    const { code } = createPermissionDto;

    // Check if permission code already exists
    const existingPermission = await this.prisma.permission.findUnique({
      where: { code },
    });

    if (existingPermission) {
      throw new ConflictException('Permission code already exists');
    }

    // If parentId is provided, verify parent exists
    if (createPermissionDto.parentId) {
      const parent = await this.prisma.permission.findUnique({
        where: { id: createPermissionDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent permission not found');
      }
    }

    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    // Check if permission exists
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Check if new code conflicts with existing permissions
    if (updatePermissionDto.code) {
      const existingPermission = await this.prisma.permission.findFirst({
        where: {
          code: updatePermissionDto.code,
          NOT: { id },
        },
      });

      if (existingPermission) {
        throw new ConflictException('Permission code already exists');
      }
    }

    // If parentId is being updated, verify new parent exists
    if (updatePermissionDto.parentId) {
      const parent = await this.prisma.permission.findUnique({
        where: { id: updatePermissionDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent permission not found');
      }

      // Prevent circular reference
      if (updatePermissionDto.parentId === id) {
        throw new ConflictException('Permission cannot be its own parent');
      }
    }

    return this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });
  }

  async remove(id: number) {
    // Check if permission exists
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        children: true,
        roles: true,
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Check if permission has children
    if (permission.children.length > 0) {
      throw new ConflictException('Cannot delete permission with children');
    }

    // Check if permission is assigned to any roles
    if (permission.roles.length > 0) {
      throw new ConflictException('Cannot delete permission assigned to roles');
    }

    await this.prisma.permission.delete({
      where: { id },
    });

    return true;
  }

  async findAllPaginated(query: QueryPermissionDto) {
    const { name, type, pageNo, pageSize } = query;
    const skip = (pageNo - 1) * Number(pageSize);

    const where = {
      ...(name && { name: { contains: name } }),
      ...(type && { type }),
    };

    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        include: {
          children: true,
        },
      }),
      this.prisma.permission.count({ where }),
    ]);

    return {
      pageData: permissions,
      total,
    };
  }
} 