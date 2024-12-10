import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: +this.configService.get('REDIS_PORT'),
      ...(parseInt(this.configService.get('REDIS_VERSION'), 10) >= 6 ? {
        username: this.configService.get('REDIS_USERNAME'),
      } : {}),
      password: this.configService.get('REDIS_PASSWORD'),
    });
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.set(key, value, 'EX', ttl);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
} 