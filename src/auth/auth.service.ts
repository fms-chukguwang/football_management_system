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

  async refreshToken(userId: number, refreshToken: string) {
    await this.validate(userId, refreshToken);

    // Generate a new access token
    const newAccessToken = this.generateAccessToken(userId);

    return newAccessToken;
  }

  @CacheKey('validateRefreshToken')
  @CacheTTL(60 * 60 * 24 * 7)
  async validate(userId: number, refreshToken: string) {
    const storedRefreshToken = await this.getRefreshTokenFromRedis(userId);

    if (refreshToken !== storedRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return true;
  }

  async setRefreshToken(userId: number, token: string) {
    await this.saveRefreshTokenToRedis(userId, token);
  }

  private generateAccessToken(userId: number): string {
    const accessToken = this.jwtService.sign({ id: userId });
    return accessToken;
  }

  async saveRefreshTokenToRedis(userId: number, refreshToken: string): Promise<void> {
    await this.redisService.saveRefreshToken(userId, refreshToken);
  }

  async getRefreshTokenFromRedis(userId: number): Promise<string | null> {
    return await this.redisService.getRefreshToken(userId);
  }

  async signUp({ email, password, passwordConfirm, name }: SignUpDto) {
    const isPasswordMatched = password === passwordConfirm;
    if (!isPasswordMatched) {
      throw new BadRequestException('비밀번호와 비밀번호 확인이 서로 일치하지 않습니다.');
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
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_SECRET,
      expiresIn: '7d',
    });
    this.userRepository.update(id, { refreshToken });
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
    const isPasswordMatched = bcrypt.compareSync(password, user?.password ?? '');

    if (!user || !isPasswordMatched) {
      return null;
    }

    return { id: user.id };
  }

  async validaterefreshToken(userId: number, refreshToken: string): Promise<User | null> {
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
      throw new UnauthorizedException('계정이 잠겼습니다. 관리자에게 문의하세요.');
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
}
