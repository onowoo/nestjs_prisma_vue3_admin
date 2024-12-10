## 介绍

后端 nestjs+prisma+redis+swagger（自动生成接口文档）

后台前端用[v3-admin](https://github.com/un-pany/v3-admin)对接，新增了一些基础功能

## 安装项目

```bash

#克隆项目到本地
$ git clone

#安装后端依赖
$ pnpm install

#安装后台依赖
$ cd admin
$ pnpm install

```

```bash
#前端地址
FRONTEND_URL=http://localhost:3200/ 
#数据库设置，postgresql（数据库类型）://postgres（账号）:maozedong（密码）@localhost（host）:5432（端口）/prismacrud（数据库名），如果使用mysql，需要对应调整schema和seed，还有实际业务中的部分数据类型
DATABASE_URL="postgresql://postgres:maozedong@localhost:5432/prismacrud?schema=public"
#jwt密钥，随机生成个32位字符串替换
JWT_SECRET=Y01ZQp1HCJzHGihNQQAmCn5wc5SfcFBb
#邮件配置
MAIL_HOST=smtp.example.com
MAIL_USER=your-email@example.com
MAIL_PASSWORD=your-password
MAIL_FROM=noreply@example.com

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default #redis6以下不用配置
REDIS_PASSWORD=123456
```

```bash
#迁移数据库
$ npx prisma db push
#初始化数据
$ npx prisma db seed
```

## 启动项目

```bash
# dev mode, 开发模式会自动启动prisma studio,方便查看和修改数据
# 开发模式会后端和后台前端一并启动，打包时建议分别打包
$ pnpm dev

# production mode
$ pnpm start:prod
$ pnpm build
```

## 前后端地址

```bash

# 后台前端访问地址
http://localhost:3200

# 后端接口文档
http://localhost:3000/docs

# prisma studio 数据库管理地址
http://localhost:5555


```

## Run tests

```bash
# unit tests
$ pnpm test

# e2e tests
$ pnpm test:e2e

# test coverage
$ pnpm test:cov
```

## 基础功能

认证系统:

- [x] JWT 基于令牌的认证
- [x] 用户登录/注册
- [x] 密码重置

验证码:

- [x] 图形验证码
- [x] 登录验证
- [x] 防暴力破解

邮箱验证:

- [x] 密码重置验证

用户管理:

- [x] 个人信息修改
- [x] 用户表单及增删改查

## todo

- 完善注册验证
- 手机验证码登录注册
- 动态路由增删改查接口
