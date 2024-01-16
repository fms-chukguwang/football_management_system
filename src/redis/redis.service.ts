import { Injectable } from '@nestjs/common';
import { RedisService as NestRedisService } from 'nestjs-redis';

@Injectable()
export class RedisService {
  private client;

  constructor(private readonly nestRedisService: NestRedisService) {
    this.client = this.nestRedisService.getClient();
  }

  async saveRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const key = `refreshToken:${userId}`;
    await this.client.set(key, refreshToken);
  }

  async getRefreshToken(userId: number): Promise<string | null> {
    const key = `refreshToken:${userId}`;
    return await this.client.get(key);
  }
}
