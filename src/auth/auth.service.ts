import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dtos/sign-up.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dtos/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { UserStatus } from '../enums/user-status.enum';
import { hashPassword } from '../helpers/password.helper';
import { CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  async refreshToken(userId: number) {
    const refreshToken = await this.getRefreshTokenFromRedis(userId);

    if (!refreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
    }

    const newAccessToken = this.generateAccessToken(userId);
    const newRefreshToken = await this.generateRefreshToken(userId);
    return { newAccessToken, newRefreshToken };
  }

  async setRefreshToken(userId: number, token: string) {
    return await this.saveRefreshTokenToRedis(userId, token);
  }

  private generateAccessToken(userId: number): string {
    const accessToken = this.jwtService.sign({ id: userId });
    return accessToken;
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const newRefreshToken = this.jwtService.sign(
      { id: userId },
      {
        secret: process.env.REFRESH_SECRET,
        expiresIn: '7d',
      },
    );
    await this.saveRefreshTokenToRedis(userId, newRefreshToken);
    return newRefreshToken;
  }

  async saveRefreshTokenToRedis(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    return await this.redisService.setRefreshToken(userId, refreshToken);
  }

  async getRefreshTokenFromRedis(userId: number): Promise<string | null> {
    return await this.redisService.getRefreshToken(userId);
  }

  async signUp({ email, password, passwordConfirm, name }: SignUpDto) {
    const isPasswordMatched = password === passwordConfirm;
    if (!isPasswordMatched) {
      throw new BadRequestException(
        '비밀번호와 비밀번호 확인이 서로 일치하지 않습니다.',
      );
    }

    const existedUser = await this.userRepository.findOne({ where: { email } });
    if (existedUser) {
      throw new BadRequestException('이미 가입된 이메일입니다.');
    }

    const hashRounds = this.configService.get<number>('PASSWORD_HASH_ROUNDS');
    const hashedPassword = bcrypt.hashSync(password, hashRounds);

    const user = await this.userRepository.save({
      email,
      password: hashedPassword,
      name,
    });

    return this.signIn(user.id);
  }

  async signIn(id: number) {
    const payload = { id };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
    });
    const refreshToken = await this.generateRefreshToken(id);
    // Database update removed, as refreshToken is stored only in Redis

    return { accessToken, refreshToken };
  }

  async signOut(id: number) {
    console.log('id=', id);
    const { refreshToken } = await this.userRepository.findOne({
      where: { id },
    });

    console.log('refreshToken', refreshToken);
    this.userRepository.update(id, { refreshToken: '' });
    console.log(this.userRepository.findOne({ where: { id } }));
  }

  async validateUser({ email, password }: SignInDto) {
    const user = await this.userRepository.findOne({
      where: { email },
      select: { id: true, password: true },
    });
    const isPasswordMatched = bcrypt.compareSync(
      password,
      user?.password ?? '',
    );

    if (!user || !isPasswordMatched) {
      return null;
    }

    return { id: user.id };
  }

  async validaterefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId, refreshToken },
    });
    console.log('validaterefreshToken user=', user);
    console.log('validaterefreshToken userId=', userId);
    console.log('validaterefreshToken refreshToken=', refreshToken);
    return user || null;
  }

  async updateUserToInactive(email: string): Promise<void> {
    await this.userRepository.update(
      { email },
      { status: UserStatus.Inactive },
    );
  }

  async validateUserStatus(userId: number, refreshToken: string) {
    const user = await this.validaterefreshToken(userId, refreshToken);

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.status === UserStatus.Inactive) {
      throw new UnauthorizedException(
        '계정이 잠겼습니다. 관리자에게 문의하세요.',
      );
    }

    return user;
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const hashedPassword = hashPassword(newPassword);
    await this.updatePassword(email, hashedPassword);
  }

  async updatePassword(email: string, newPassword: string): Promise<void> {
    const user = await this.userService.findOneByEmail(email);

    if (user) {
      user.password = newPassword;
      await this.userRepository.save(user);
    }
  }

  async OAuthLogin({ req, res }) {
    let user = await this.userService.findOneByEmail(req.user.email);

    if (!user) {
      await this.userRepository.create({ ...req.user });
    }

    this.setRefreshToken(user.id, res);
    res.redirect('리다이렉트할 url주소');
  }

  // 이메일에서 수락버튼시 사용하는 token으로 수락 유효기간(3일)에 맞게 해둠
  generateAccessEmailToken(userId: number): string {
    const payload = { userId };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '3d',
    });
    return accessToken;
  }
}
