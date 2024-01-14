export interface RedisClient {
    set(key: string, value: string, callback: (err: Error | null, reply: string) => void): void;
    get(key: string, callback: (err: Error | null, reply: string) => void): void;
  
  }