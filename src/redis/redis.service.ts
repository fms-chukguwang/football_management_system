import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redisClient: IORedis;
  private readonly refreshTokenTTL: number = 1 * 24 * 60 * 60; // 하루

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new IORedis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
    });
    this.redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });
    this.redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  async setRefreshToken(userId: number, refreshToken: string): Promise<void> {
    await this.redisClient.set(`refreshToken:${userId}`, refreshToken);
    await this.redisClient.expire(
      `refreshToken:${userId}`,
      this.refreshTokenTTL,
    );
  }

  async getRefreshToken(userId: number): Promise<string | null> {
    return await this.redisClient.get(`refreshToken:${userId}`);
  }
  async deleteRefreshToken(userId: number): Promise<void> {
   await this.redisClient.del(`refreshToken:${userId}`);
  }
}
