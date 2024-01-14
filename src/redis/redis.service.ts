import { Injectable } from '@nestjs/common';
import { RedisClient } from './interfaces/redis-client.interface';

@Injectable()
export class RedisService {
  constructor(private readonly redisClient: RedisClient) {}

  saveRefreshToken(userId: number, refreshToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.redisClient.set(`refreshToken:${userId}`, refreshToken, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  getRefreshToken(userId: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.redisClient.get(`refreshToken:${userId}`, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }
}
