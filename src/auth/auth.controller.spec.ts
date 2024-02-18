import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { faker } from '@faker-js/faker';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let emailService: EmailService;
  let userService: UserService;
  let configService: ConfigService;

  let app: INestApplication;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService, EmailService, UserService, ConfigService, JwtService],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    emailService = module.get<EmailService>(EmailService);
    userService = module.get<UserService>(UserService);
    configService = module.get<ConfigService>(ConfigService);
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('signUp', () => {
    it('/auth/sign-up (POST)', async () => {
      const signUpDto = {
        passwordConfirm: 'Ex@mp1e!!',
        email: faker.internet.email(),
        password: 'Ex@mp1e!!',
        name: faker.person.fullName(),
      };

      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpDto)
        .expect(201);
    });
  });

  describe('signIn', () => {
    it('/auth/sign-in (POST)', async () => {
      const signInDto = {
        email: faker.internet.email(),
        password: 'Ex@mp1e!!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(signInDto)
        .expect(200);
    });
  });

  describe('signOut', () => {
    it('/auth/sign-out (POST)', async () => {
      const signInDto = {
        email: faker.internet.email(),
        password: 'Ex@mp1e!!',
      };

      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(signInDto);

      const response = await request(app.getHttpServer())
        .post('/auth/sign-out')
        .set('Authorization', 'Bearer accessToken')
        .expect(200);
    });
  });

  describe('refresh', () => {
    it('/auth/refresh (POST)', async () => {
      const signInDto = {
        email: faker.internet.email(),
        password: 'Ex@mp1e!!',
      };

      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(signInDto);

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer accessToken')
        .expect(200);
    });
  });
  describe('sendVerificationEmail', () => {
    it('/auth/send-verification-email (POST)', async () => {
      const emailVerifyDto = {
        email: faker.internet.email(),
      };

      const response = await request(app.getHttpServer())
        .post('/auth/send-verification-email')
        .send(emailVerifyDto)
        .expect(200);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('/auth/send-password-reset-email (POST)', async () => {
      const passwordResetUserDto = {
        email: faker.internet.email(),
      };

      const response = await request(app.getHttpServer())
        .post('/auth/send-password-reset-email')
        .send(passwordResetUserDto)
        .expect(200);
    });
  });
  describe('sendCode', () => {
    it('/auth/send-code (POST)', async () => {
      const emailVerifyDto = {
        email: faker.internet.email(),
      };

      const response = await request(app.getHttpServer())
        .post('/auth/send-code')
        .send(emailVerifyDto)
        .expect(200);
    });
  });
  describe('verifyCode', () => {
    it('/auth/verify-code (POST)', async () => {
      const verifyCodeDto = {
        email: faker.internet.email(),
        verificationCode: '123456',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/verify-code')
        .send(verifyCodeDto)
        .expect(200);
    });
  });

  describe('resetPassword', () => {
    it('/auth/reset-password (POST)', async () => {
      const resetPasswordDto = {
        email: faker.internet.email(),
        newPassword: 'NewPassword123!',
        verificationCode: '123456',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(resetPasswordDto)
        .expect(200);
    });
  });
});
