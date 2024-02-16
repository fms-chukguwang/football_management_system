import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { UserStatus } from '../enums/user-status.enum';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
    let service: AuthService;

    const mockConfigService = {
        get: jest.fn(),
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
            { provide: RedisService, useValue: mockRedisService },
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

            const expectedToken = 'access-token';

            mockUserService.findOneByEmail.mockResolvedValueOnce(null);
            mockUserRepository.save.mockResolvedValueOnce({ id: 1 });

            mockJwtService.sign.mockReturnValueOnce(expectedToken);

            // Act
            const result = await service.signUp(signUpDto);

            // Assert
            expect(result).toEqual({ accessToken: expectedToken });
            expect(mockUserService.findOneByEmail).toHaveBeenCalledWith(signUpDto.email);
            expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                email: signUpDto.email,
                password: expect.any(String),
                name: signUpDto.name,
            }));
            expect(mockJwtService.sign).toHaveBeenCalledWith({ id: 1 }, { secret: process.env.JWT_SECRET });
        });

        it('should throw BadRequestException if passwords do not match', async () => {
            // Arrange
            const signUpDto = {
                email: 'test@example.com',
                password: 'Ex@mp1e!!',
                passwordConfirm: 'Ex@mp1e',
                name: 'Test User',
            };

            // Act + Assert
            await expect(service.signUp(signUpDto)).rejects.toThrowError(BadRequestException);
        });

        it('should throw BadRequestException if email already exists', async () => {
            // Arrange
            const signUpDto = {
                email: 'test@example.com',
                password: 'Ex@mp1e!!',
                passwordConfirm: 'Ex@mp1e!!',
                name: 'Test User',
            };

            mockUserService.findOneByEmail.mockResolvedValueOnce({ id: 1 });

            // Act + Assert
            await expect(service.signUp(signUpDto)).rejects.toThrowError(BadRequestException);
        });
    });

    describe('signIn', () => {
        it('should sign in and return access and refresh tokens', async () => {
            // Arrange
            const userId = 1;
            const expectedAccessToken = 'access-token';
            const expectedRefreshToken = 'refresh-token';

            mockJwtService.sign.mockReturnValueOnce(expectedAccessToken);
            mockUserService.findOneById.mockResolvedValueOnce({ id: userId });
            mockJwtService.sign.mockReturnValueOnce(expectedRefreshToken);
            mockRedisService.setRefreshToken.mockResolvedValueOnce(undefined);

            // Act
            const result = await service.signIn(userId);

            // Assert
            expect(result).toEqual({ accessToken: expectedAccessToken, refreshToken: expectedRefreshToken });
            expect(mockJwtService.sign).toHaveBeenCalledWith({ id: userId }, { secret: process.env.JWT_SECRET });
            expect(mockUserService.findOneById).toHaveBeenCalledWith(userId);
            expect(mockRedisService.setRefreshToken).toHaveBeenCalledWith(userId, expectedRefreshToken);
        });
    });

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
            expect(mockUserService.findOneByEmail).toHaveBeenCalledWith(signInDto.email);
        });

        it('should return null if user credentials are invalid', async () => {
            // Arrange
            const signInDto = { email: 'test@example.com', password: 'password' };

            mockUserService.findOneByEmail.mockResolvedValueOnce(null);

            // Act
            const result = await service.validateUser(signInDto);

            // Assert
            expect(result).toBeNull();
            expect(mockUserService.findOneByEmail).toHaveBeenCalledWith(signInDto.email);
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
            expect(mockUserService.findOneByEmail).toHaveBeenCalledWith(email);
            expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining({ password: newPassword }));
        });
    });

 
});
