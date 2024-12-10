import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password: await bcrypt.hash('123456', 10),
      enable: true,
      profile: {
        create: {
          avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif?imageView2/1/w/80/h/80',
          nickName: 'Admin'
        }
      }
    }
  })

  // Create roles
  const superAdminRole = await prisma.role.create({
    data: {
      code: 'SUPER_ADMIN',
      name: '超级管理员',
      enable: true
    }
  })

  const qaRole = await prisma.role.create({
    data: {
      code: 'ROLE_QA',
      name: '质检员',
      enable: true
    }
  })

  // Create permissions
  const demoMenu = await prisma.permission.create({
    data: {
      name: '业务示例',
      code: 'Demo',
      type: 'MENU',
      icon: 'i-fe:grid',
      show: true,
      enable: true,
      order: 1
    }
  })

  const sysMenu = await prisma.permission.create({
    data: {
      name: '系统管理',
      code: 'SysMgt',
      type: 'MENU',
      icon: 'i-fe:grid',
      show: true,
      enable: true,
      order: 2
    }
  })

  const baseMenu = await prisma.permission.create({
    data: {
      name: '基础功能',
      code: 'Base',
      type: 'MENU',
      path: '/base',
      icon: 'i-fe:grid',
      show: true,
      enable: true,
      order: 0
    }
  })

  // Create sub-permissions
  await prisma.permission.createMany({
    data: [
      {
        name: '资源管理',
        code: 'Resource_Mgt',
        type: 'MENU',
        parentId: sysMenu.id,
        path: '/pms/resource',
        icon: 'i-fe:list',
        component: '/src/views/pms/resource/index.vue',
        show: true,
        enable: true,
        order: 1
      },
      {
        name: '角色管理',
        code: 'RoleMgt',
        type: 'MENU',
        parentId: sysMenu.id,
        path: '/pms/role',
        icon: 'i-fe:user-check',
        component: '/src/views/pms/role/index.vue',
        show: true,
        enable: true,
        order: 2
      },
      {
        name: '用户管理',
        code: 'UserMgt',
        type: 'MENU',
        parentId: sysMenu.id,
        path: '/pms/user',
        icon: 'i-fe:user',
        component: '/src/views/pms/user/index.vue',
        keepAlive: true,
        show: true,
        enable: true,
        order: 3
      },
      {
        name: '分配用户',
        code: 'RoleUser',
        type: 'MENU',
        parentId: 3, // 角色管理的ID
        path: '/pms/role/user/:roleId',
        icon: 'i-fe:user-plus',
        component: '/src/views/pms/role/role-user.vue',
        show: false,
        enable: true,
        order: 1
      },
      {
        name: '图片上传',
        code: 'ImgUpload',
        type: 'MENU',
        parentId: demoMenu.id,
        path: '/demo/upload',
        icon: 'i-fe:image',
        component: '/src/views/demo/upload/index.vue',
        keepAlive: true,
        show: true,
        enable: true,
        order: 2
      },
      {
        name: '个人资料',
        code: 'UserProfile',
        type: 'MENU',
        path: '/profile',
        icon: 'i-fe:user',
        component: '/src/views/profile/index.vue',
        show: false,
        enable: true,
        order: 99
      },
      {
        name: '基础组件',
        code: 'BaseComponents',
        type: 'MENU',
        parentId: baseMenu.id,
        path: '/base/components',
        icon: 'i-me:awesome',
        component: '/src/views/base/index.vue',
        show: true,
        enable: true,
        order: 1
      },
      {
        name: 'Unocss',
        code: 'Unocss',
        type: 'MENU',
        parentId: baseMenu.id,
        path: '/base/unocss',
        icon: 'i-me:awesome',
        component: '/src/views/base/unocss.vue',
        show: true,
        enable: true,
        order: 2
      },
      {
        name: 'KeepAlive',
        code: 'KeepAlive',
        type: 'MENU',
        parentId: baseMenu.id,
        path: '/base/keep-alive',
        icon: 'i-me:awesome',
        component: '/src/views/base/keep-alive.vue',
        keepAlive: true,
        show: true,
        enable: true,
        order: 3
      },
      {
        name: '创建新用户',
        code: 'AddUser',
        type: 'BUTTON',
        parentId: 4, // 用户管理的ID
        show: true,
        enable: true,
        order: 1
      },
      {
        name: '图标 Icon',
        code: 'Icon',
        type: 'MENU',
        parentId: baseMenu.id,
        path: '/base/icon',
        icon: 'i-fe:feather',
        component: '/src/views/base/unocss-icon.vue',
        show: true,
        enable: true,
        order: 0
      },
      {
        name: 'MeModal',
        code: 'TestModal',
        type: 'MENU',
        parentId: baseMenu.id,
        path: '/testModal',
        icon: 'i-me:dialog',
        component: '/src/views/base/test-modal.vue',
        show: true,
        enable: true,
        order: 5
      }
    ]
  })

  // Associate roles with user
  await prisma.user.update({
    where: { id: adminUser.id },
    data: {
      roles: {
        connect: [
          { id: superAdminRole.id },
          { id: qaRole.id }
        ]
      }
    }
  })

  // Associate permissions with QA role
  const allPermissions = await prisma.permission.findMany({
    where: {
      code: {
        in: [
          'Resource_Mgt',
          'SysMgt',
          'RoleMgt',
          'UserMgt',
          'RoleUser',
          'Base',
          'BaseComponents',
          'Unocss',
          'KeepAlive',
          'Icon',
          'TestModal'
        ]
      }
    }
  })

  await prisma.role.update({
    where: { id: qaRole.id },
    data: {
      permissions: {
        connect: allPermissions.map(p => ({ id: p.id }))
      }
    }
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
