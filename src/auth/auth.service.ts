import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SignUpDto } from './dtos/sign-up.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { MongoExpiredSessionError, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dtos/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { UserStatus } from '../enums/user-status.enum';
import { hashPassword } from '../helpers/password.helper';
import { CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { RedisService } from '../redis/redis.service';
import { VerifyCodeDto } from './dtos/verify-code.dto';
import { VerifyKakaoCodeDto } from './dtos/verify-kakao-code.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly redisService: RedisService,
    ) {}

    async kakaoCode() {
        // 6자리의 랜덤 숫자 생성
        const randomDigitNumber = Math.floor(100000 + Math.random() * 900000);
        return randomDigitNumber;
    }

    async refreshToken(userId: number) {
        // const refreshToken =  await this.redisService.getRefreshToken(userId);
        // console.log(refreshToken);
        // if (!refreshToken) {
        //     throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
        // }
        const newAccessToken = this.generateAccessToken(userId);
        const newRefreshToken = await this.generateRefreshToken(userId);
        return { newAccessToken, newRefreshToken };
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
        await this.redisService.setRefreshToken(userId, newRefreshToken);
        return newRefreshToken;
    }

    async signUp({ email, password, passwordConfirm, name }: SignUpDto) {
        const isPasswordMatched = password === passwordConfirm;
        if (!isPasswordMatched) {
            throw new BadRequestException('비밀번호와 비밀번호 확인이 서로 일치하지 않습니다.');
        }

        const existedUser = await this.userRepository.findOne({
            where: { email },
        });
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

    //사실상 쿠키를 지우는게 로그아웃인데 필요한지 모르겠음
    async signOut(id: number) {
        console.log('id=', id);

        // 리프레시 토큰을 제거하려면 다음과 같이 Redis 또는 다른 저장소에서 제거
        await this.redisService.deleteRefreshToken(id);

        // 사용자 업데이트를 위한 코드 ->
        // 회원가입할때 리프레시토큰 다시 생성해서 필요없음
        // this.userRepository.update(id, { refreshToken: '' });

        console.log(await this.userRepository.findOne({ where: { id } }));
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

    async updateUserToInactive(email: string): Promise<void> {
        await this.userRepository.update({ email }, { status: UserStatus.Inactive });
    }

    async validateUserStatus(userId: number) {
        const user = await this.userService.findOneById(userId);

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
    async generateKakaoCode(user) {
        console.log('user=', user);
        if (!user || !user.email) {
            // 유효한 사용자 정보가 없는 경우에 대한 예외 처리
            return { kakaoCode: null, shouldRedirect: false };
        }
        console.log('user email =', user.email);
        const existingUser = await this.userRepository.findOne({
            where: { email: user.email },
        });
        console.log('existingUser =', existingUser);
        const kakaoCode = await this.kakaoCode();
        console.log('code=', kakaoCode);
        console.log('typeof kakaoCode=', typeof kakaoCode);
        if (existingUser) {
            this.redisService.kakaoCode(existingUser.id, kakaoCode);
            console.log('kakaoCode existing user saved to Redis');
            // 리다이렉션 true
            return { kakaoCode: kakaoCode, shouldRedirect: true };
        }

        const savedUser = await this.userRepository.save({
            email: user.email,
            name: user.name,
            is_social_login_user: true,
        });
        console.log('saved user=', savedUser);

        // 신규 사용자에 대한 처리
        await this.redisService.kakaoCode(savedUser.id, kakaoCode);
        console.log('kakaoCode new user saved to Redis');
        return { kakaoCode: kakaoCode, shouldRedirect: true };
    }

    //유저 아이디 필요한가? -> 그 유저 전용 토큰 만들어야해서 필요함
    async verifyKakaoCode({ code }: VerifyKakaoCodeDto) {
        console.log('verifyKakaoCode called');
        const userId = await this.redisService.getUserId(code);
        if (userId) {
            const { newAccessToken, newRefreshToken } = await this.refreshToken(userId);

            // 리다이렉션 true
            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                shouldRedirect: true,
            };
        }
        return { accessToken: null, refreshToken: null, shouldRedirect: false };
    }

    async OAuthLogin(user) {
        if (!user || !user.email) {
            // 유효한 사용자 정보가 없는 경우에 대한 예외 처리
            return { accessToken: null, refreshToken: null, shouldRedirect: false };
        }
        console.log('req.user=', user);
        console.log('req.user.email=', user.email);
        const existingUser = await this.userRepository.findOne({
            where: { email: user.email },
        });
        console.log('user=', existingUser);

        if (existingUser) {
            const { newAccessToken, newRefreshToken } = await this.refreshToken(existingUser.id);

            // 리다이렉션 true
            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                shouldRedirect: true,
            };
        }

        const savedUser = await this.userRepository.save({
            email: user.email,
            name: user.name,
            is_social_login_user: true,
        });
        console.log('saved user=', savedUser);

        // 신규 사용자에 대한 처리
        const refreshToken = await this.generateRefreshToken(savedUser.id);
        this.redisService.setRefreshToken(savedUser.id, refreshToken);
        const accessToken = await this.generateAccessToken(savedUser.id);

        return { accessToken: accessToken, refreshToken: refreshToken, shouldRedirect: true };
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
