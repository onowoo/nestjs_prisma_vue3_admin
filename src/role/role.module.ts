import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisService } from '../redis/redis.service';

@Module({
  imports: [PrismaModule],
  controllers: [RoleController],
  providers: [RoleService, RedisService],
  exports: [RoleService],
})
export class RoleModule {} 