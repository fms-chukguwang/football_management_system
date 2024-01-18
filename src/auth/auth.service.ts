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
import { Request } from 'express';
import { UserService } from '../user/user.service';
import { UserStatus } from '../enums/user-status.enum';
import { hashPassword } from '../helpers/password.helper';
import passport from 'passport';

interface CustomRequest extends Request {
    session: any;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async signUp({ email, password, passwordConfirm, name }: SignUpDto) {
        const isPasswordMatched = password === passwordConfirm;
        if (!isPasswordMatched) {
            throw new BadRequestException(
                '비밀번호와 비밀번호 확인이 서로 일치하지 않습니다.',
            );
        }

        const existedUser = await this.userRepository.findOne({
            where: { email },
        });
        if (existedUser) {
            throw new BadRequestException('이미 가입된 이메일입니다.');
        }

        const hashRounds = this.configService.get<number>(
            'PASSWORD_HASH_ROUNDS',
        );
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

    async refreshToken(userId: number, token: string) {
        await this.validate(userId, token);
        return this.signIn(userId);
    }

    private generateAccessToken(userId: number): string {
        const accessToken = this.jwtService.sign({ id: userId });
        return accessToken;
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

    async validate(userId: number, refreshToken: string) {
        const user = await this.validaterefreshToken(userId, refreshToken);
        console.log('validate user=', user);
        console.log('validate userId=', userId);
        console.log('validate refreshToken=', refreshToken);
        if (!user) {
            throw new UnauthorizedException();
        }

        return user;
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
        // 1. 회원조회
        let user = await this.userService.findOneByEmail(req.user.email); //user를 찾아서

        // 2, 회원가입이 안되어있다면? 자동회원가입
        if (!user) {
            await this.userRepository.create({ ...req.user });
        } //user가 없으면 하나 만들고, 있으면 이 if문에 들어오지 않을거기때문에 이러나 저러나 user는 존재하는게 됨.

        // 3. 회원가입이 되어있다면? 로그인(AT, RT를 생성해서 브라우저에 전송)한다
        this.setRefreshToken(user.id, res);
        res.redirect('리다이렉트할 url주소');
    }

    async setRefreshToken(userId: number, token: string) {
        await this.validate(userId, token);
        return this.signIn(userId);
    }
}
