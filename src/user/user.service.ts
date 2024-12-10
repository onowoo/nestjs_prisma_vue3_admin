import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QueryUserDto } from './dto/query-user.dto';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async findAll(query: QueryUserDto) {
    const { username, pageNo, pageSize } = query;
    const skip = (pageNo - 1) * pageSize;

    const where = {
      ...(username && { username: { contains: username } }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          profile: true,
          roles: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const pageData = users.map(user => ({
      id: user.id,
      username: user.username,
      enable: user.enable,
      createTime: user.createTime,
      updateTime: user.updateTime,
      roles: user.roles,
      gender: user.profile?.gender,
      avatar: user.profile?.avatar,
      address: user.profile?.address,
      email: user.profile?.email,
    }));

    return {
      pageData,
      total,
    };
  }

  async findOne(id: number) {
    if (!id) {
      throw new Error('User ID is required');
    }
  
    // 1. 获取用户信息和角色权限
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        roles: {
          where: { enable: true },
          include: {
            permissions: {
              where: { enable: true },
            },
          },
        },
      },
    });
  
    if (!user) {
      throw new Error('User not found');
    }
  
    // 2. 获取 Redis 中的用户信息
    const userInfoStr = await this.redisService.get(`user:${id}`);
    const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
    const currentRole = userInfo?.currentRole || user.roles[0];
  
    // 3. 判断是否需要获取所有权限（超级管理员）
    let allPermissions: any[];
    const hasEmptyPermissionRole = user.roles.some(role => role.permissions.length === 0);
  
    if (hasEmptyPermissionRole) {
      // 超级管理员：获取所有启用的权限
      allPermissions = await this.prisma.permission.findMany({
        where: { enable: true },
        include: {
          children: {
            where: { enable: true },
          },
        },
      });
    } else {
      // 普通用户：只获取角色关联的权限
      allPermissions = user.roles.flatMap(role => role.permissions);
    }
  
    // 4. 构建菜单树
    const permissionMap = new Map();
    allPermissions.forEach(permission => {
      permissionMap.set(permission.id, {
        id: permission.id,
        name: permission.name,
        code: permission.code,
        type: permission.type,
        path: permission.path,
        redirect: permission.redirect,
        icon: permission.icon,
        component: permission.component,
        layout: permission.layout,
        keepAlive: permission.keepAlive,
        show: permission.show,
        order: permission.order,
        parentId: permission.parentId,
        children: [],
      });
    });
  
    const menuTree = [];
    permissionMap.forEach(permission => {
      if (!permission.parentId) {
        menuTree.push(permission);
      } else {
        const parent = permissionMap.get(permission.parentId);
        if (parent) {
          parent.children.push(permission);
        }
      }
    });
  
    // 5. 排序
    const sortMenuTree = (items) => {
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      items.forEach(item => {
        if (item.children.length > 0) {
          sortMenuTree(item.children);
        }
      });
      return items;
    };
  
    return {
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
      menuTree: sortMenuTree(menuTree),
    };
  }
  
  async create(createUserDto: CreateUserDto) {
    const { username, password, roleIds, ...profileData } = createUserDto;

    // Check if username already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        profile: {
          create: profileData,
        },
        roles: {
          connect: roleIds.map(id => ({ id })),
        },
      },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { roleIds, ...updateData } = updateUserDto;

    // Check if user exists
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        ...(roleIds && {
          roles: {
            set: roleIds.map(id => ({ id })),
          },
        }),
        profile: {
          update: updateData,
        },
      },
    });
  }

  async remove(id: number) {
    // Check if user exists
    await this.findOne(id);

    await this.prisma.user.delete({
      where: { id },
    });

    return true;
  }

  async resetPassword(id: number) {
    // Check if user exists
    await this.findOne(id);

    const defaultPassword = '123456'; // You might want to make this configurable
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return true;
  }

  async findAllPaginated(query: QueryUserDto) {
    const { username, enable, pageNo, pageSize } = query;
    const skip = (pageNo - 1) * Number(pageSize);

    const where = {
      ...(username && { username: { contains: username } }),
      ...(enable !== undefined && { enable }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        include: {
          profile: true,
          roles: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      pageData: users,
      total,
    };
  }

  async findByUsername(username: string) {
    if (!username) {
      throw new Error('Username is required');
    }

    return await this.prisma.user.findUnique({
      where: {
        username: username,
      },
      include: {
        profile: true,
        roles: {
          where: { enable: true },
          include: {
            permissions: true,
          },
        },
      },
    });
  }
}