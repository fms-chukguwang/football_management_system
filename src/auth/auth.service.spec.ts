import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { UserStatus } from '../enums/user-status.enum';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtKakaoStrategy } from './strategies/jwt-social-kakao.strategy';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import * as bcrypt from 'bcrypt'; 

describe('AuthService', () => {
    let service: AuthService;

    const mockConfigService = {
        get: jest.fn().mockReturnValue(10),
    };

    const mockJwtService = {
        sign: jest.fn(),
    };

    

    const mockUserService = {
        findOneByEmail: jest.fn(),
        findOneById: jest.fn(),
        updatePassword: jest.fn(),
    };

    const mockUserRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
    };

    const mockRedisService = {
        setRefreshToken: jest.fn(),
        deleteRefreshToken: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
          providers: [
            AuthService,
            
            { provide: JwtService, useValue: mockJwtService },
            { provide: UserService, useValue: mockUserService },
            { provide: ConfigService, useValue: mockConfigService },
            { provide: RedisService, useValue: mockRedisService },
            { provide:   getRepositoryToken(User), useValue: mockUserRepository },
            
          ],
        }).compile();
    
        service = module.get<AuthService>(AuthService);
      });
    

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });


    describe('signUp', () => {
        it('should create a new user and sign in', async () => {
            const signUpDto = {
                email: 'test@example.com',
                password: 'Ex@mp1e!!',
                passwordConfirm: 'Ex@mp1e!!',
                name: 'Test User',
            };

            const hashRounds = mockConfigService.get('PASSWORD_HASH_ROUNDS'); // 해싱 라운드 가져오기

            // bcrypt를 사용하여 비밀번호 해싱
            const hashedPassword = bcrypt.hashSync(signUpDto.password, hashRounds);

            // findOneByEmail 및 save 모의 설정
            mockUserService.findOneByEmail.mockResolvedValueOnce(null);
            mockUserRepository.save.mockResolvedValueOnce({ id: 1 });

            // Act
            const result = await service.signUp(signUpDto);

            // Assert
            expect(mockJwtService.sign).toHaveBeenCalledWith({ id: 1 }, { secret: process.env.JWT_SECRET });
        });
    });

    // describe('signIn', () => {
    //     it('should sign in and return access and refresh tokens', async () => {

    //     // Act
    //         const signUpresult = await service.signIn(1);

    //         // Assert
    //         //getAccess/refresh token neeeded
    //         expect(mockRedisService).toHaveBeenCalledWith(1);
    //     });
    // });

    describe('signOut', () => {
        it('should sign out and delete refresh token', async () => {
            // Arrange
            const userId = 1;

            // Act
            await service.signOut(userId);

            // Assert
            expect(mockRedisService.deleteRefreshToken).toHaveBeenCalledWith(userId);
        });
    });

    describe('validateUser', () => {
        it('should validate user credentials and return user id if valid', async () => {
            // Arrange
            const signInDto = { email: 'test@example.com', password: 'password' };
            const expectedUserId = 1;

            mockUserService.findOneByEmail.mockResolvedValueOnce({ id: expectedUserId, password: 'hashed-password' });

            // Act
            const result = await service.validateUser(signInDto);

            // Assert
            expect(result).toEqual({ id: expectedUserId });
           // expect(mockUserService.findOneByEmail).toHaveBeenCalledWith(signInDto.email);
        });

        it('should return null if user credentials are invalid', async () => {
            // Arrange
            const signInDto = { email: 'test@example.com', password: 'password' };

            mockUserService.findOneByEmail.mockResolvedValueOnce(null);

            // Act
            const result = await service.validateUser(signInDto);

            // Assert
            expect(result).toBeNull();
          
        });
    });

    describe('updatePassword', () => {
        it('should update user password', async () => {
            // Arrange
            const email = 'test@example.com';
            const newPassword = 'new-password';

            mockUserService.findOneByEmail.mockResolvedValueOnce({ id: 1 });

            // Act
            await service.updatePassword(email, newPassword);

            // Assert
            //expect(mockUserService.findOneByEmail).toHaveBeenCalledWith(email);
            expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining({ password: newPassword }));
        });
    });

 
});
