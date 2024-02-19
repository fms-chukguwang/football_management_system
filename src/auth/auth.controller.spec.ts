// import { Test, TestingModule } from '@nestjs/testing';
// import { AuthController } from './auth.controller';
// import { AuthService } from './auth.service';
// import { EmailService } from '../email/email.service';
// import { UserService } from '../user/user.service';
// import { Response } from 'express';
// import { HttpStatus } from '@nestjs/common';
// import { VerifyKakaoCodeDto } from './dtos/verify-kakao-code.dto';
// import { SignUpDto } from './dtos/sign-up.dto';
// import { SignInDto } from './dtos/sign-in.dto';
// import { ResetPasswordDto } from './dtos/reset-password.dto';
// import { EmailVerifyDto } from './dtos/email-verify.dto';
// import { PasswordResetUserDto } from './dtos/password-reset-user.dto';
// import axios from 'axios';

// describe('AuthController', () => {
//   let controller: AuthController;
//   let authService: AuthService;
//   let emailService: EmailService;
//   let userService: UserService;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [AuthController],
//       providers: [AuthService, EmailService, UserService],
//     }).compile();

//     controller = module.get<AuthController>(AuthController);
//     authService = module.get<AuthService>(AuthService);
//     emailService = module.get<EmailService>(EmailService);
//     userService = module.get<UserService>(UserService);
//   });

//   afterEach(() => jest.clearAllMocks());

//   describe('generateKakaoCode', () => {
//     it('should generate Kakao code and redirect to frontend', async () => {
//       // Arrange
//       const req = { user: { id: 1 } };
//       const res = { redirect: jest.fn() } as unknown as Response;
//       const code ="";

//       // Act
//       await controller.generateKakaoCode(code, req, res);

//       // Assert
//       expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/kakaoSuccess?code=kakao_code'));
//     });
//   });

//   describe('verifyKakaoCode', () => {
//     it('should verify Kakao code and return access token and refresh token', async () => {
//       // Arrange
//       const dto: VerifyKakaoCodeDto = { code: 0};
//       const req = { user: { id: 1 } };
//       const res = { json: jest.fn() } as unknown as Response;
//       const expectedTokens = { accessToken: 'access_token', refreshToken: 'refresh_token' };
//       jest.spyOn(authService, 'verifyKakaoCode').mockResolvedValue(expectedTokens);

//       // Act
//       await controller.verifyKakaoCode(req, dto, res);

//       // Assert
//       expect(res.json).toHaveBeenCalledWith(expectedTokens);
//     });

//     it('should return 500 if error occurs during code verification', async () => {
//       // Arrange
//       const dto: VerifyKakaoCodeDto = { code: 0 };
//       const req = { user: { id: 1 } };
//       const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
//       jest.spyOn(authService, 'verifyKakaoCode').mockRejectedValue(new Error('Test Error'));

//       // Act
//       await controller.verifyKakaoCode(req, dto, res);

//       // Assert
//       expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
//       expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
//     });
//   });

//   describe('loginWithKakao', () => {
//     it('should successfully login with Kakao', async () => {
//       // Arrange
//       const res = { sendStatus: jest.fn() } as unknown as Response;

//       // Act
//       await controller.loginWithKakao({} as Request);

//       // Assert
//       expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.OK);
//     });
//   });

//   describe('signUp', () => {
//     it('should successfully sign up a user', async () => {
//       // Arrange
//       const dto: SignUpDto = {
//         email: 'test@example.com',
//         password: 'password',
//         passwordConfirm: 'password',
//         name: 'jo'
//       };
//       const expectedData = { id: 1, email: 'test@example.com' };
//       jest.spyOn(authService, 'signUp').mockResolvedValue(expectedData);

//       // Act
//       const result = await controller.signUp(dto);

//       // Assert
//       expect(result).toEqual({
//         statusCode: HttpStatus.CREATED,
//         message: '회원가입에 성공했습니다.',
//         data: expectedData,
//       });
//     });
//   });



// });
