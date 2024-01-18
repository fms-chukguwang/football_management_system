import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Headers,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
  Get,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dtos/sign-up.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SignInDto } from './dtos/sign-in.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { EmailVerifyDto } from './dtos/email-verify.dto';
import { EmailService } from '../email/email.service';
import { VerifyCodeDto } from './dtos/verify-code.dto';
import { extractTokenFromHeader } from '../helpers/auth.helper';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { UserService } from '../user/user.service';
import { PasswordResetUserDto } from './dtos/password-reset-user.dto';
import { Response } from 'express';

interface IOAuthUser {
  user: {
    name: string;
    email: string;
    password: string;
  };
}
@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
  ) {}

  /**
   * 카카오로그인  CODE_REDIRECT_URI
   * @param req
   * @returns
   */
  @Get('/kakao/callback')
  async getKakaoInfo(@Query() code: string) {
    console.log(code);
    return {
      statusCode: HttpStatus.CREATED,
      message: '카카오 로그인에 성공했습니다.',
      code,
    };
  }

  /**
   * 카카오로그인
   * @param req
   * @returns
   */
  @Get('/kakao')
  async loginWithKakao(@Res() res: Response) {
    const url = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${process.env.KAKAO_API_KEY}&redirect_uri=${process.env.KAKAO_CALLBACK_URL}`;
    res.redirect(url);
  }

  /**
   * 회원가입
   * @param signUpDto
   * @returns
   */
  @Post('/sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    const data = await this.authService.signUp(signUpDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: '회원가입에 성공했습니다.',
      data,
    };
  }

  /**
   * 로그인
   * @param req
   * @param signInDto
   * @returns
   */
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @Post('/sign-in')
  async signIn(@Request() req, @Body() signInDto: SignInDto) {
    const data = await this.authService.signIn(req.user.id);

    return {
      statusCode: HttpStatus.OK,
      message: '로그인에 성공했습니다.',
      data,
    };
  }

  /**
   * 로그아웃
   * @param req
   * @returns
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/sign-out')
  async signOut(@Request() req) {
    console.log('req.user=', req.user);
    const data = await this.authService.signOut(req.user.id);

    return {
      statusCode: HttpStatus.OK,
      message: '로그아웃에 성공했습니다.',
      data,
    };
  }

  /**
   * 액세스 토큰 재발급
   * @param req
   * @returns {Object} statusCode, message, accessToken
   */

  @ApiBearerAuth()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req) {
    const authHeader = req.headers['authorization'];
    console.log(authHeader);
    const token = extractTokenFromHeader(authHeader);
    console.log(token);
    const accessToken = await this.authService.refreshToken(req.user.id);

    return {
      statusCode: HttpStatus.OK,
      message: '토큰 재발급에 성공했습니다.',
      accessToken,
    };
  }

  /**
   * 이메일 인증 (회원가입시)
   * @param emailVerifyDto - 사용자 이메일 및 인증 관련 정보를 담은 DTO
   * @returns 인증 번호를 이메일로 전송한 결과 메시지
   */
  @HttpCode(HttpStatus.OK)
  @Post('/send-verification-email')
  async sendVerificationEmail(@Body() emailVerifyDto: EmailVerifyDto) {
    const { email } = emailVerifyDto;

    // 이메일 중복 체크
    const existingUser = await this.userService.findOneByEmail(email);
    if (existingUser) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: '이미 등록된 이메일 주소입니다.',
      };
    }

    const emailSent = await this.emailService.sendVerificationEmail(email);

    if (!emailSent) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '이메일 전송에 실패했습니다.',
      };
    }

    return {
      statusCode: HttpStatus.OK,
      message: '이메일 인증 코드를 전송했습니다.',
    };
  }

  /**
   * 이메일 인증 (비밀번호 재설정시)
   * @param passwordResetUserDto - 사용자 이메일 및 인증 관련 정보를 담은 DTO
   * @returns 인증 번호를 이메일로 전송한 결과 메시지
   */
  @HttpCode(HttpStatus.OK)
  @Post('/send-password-reset-email')
  async sendPasswordResetEmail(
    @Body() passwordResetUserDto: PasswordResetUserDto,
  ) {
    const { email } = passwordResetUserDto;

    // 이메일 중복 체크
    const existingUser = await this.userService.findOneByEmail(email);
    if (!existingUser) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: '등록된 이메일 주소없니다.',
      };
    }

    const emailSent = await this.emailService.sendVerificationEmail(email);

    if (!emailSent) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '이메일 전송에 실패했습니다.',
      };
    }

    return {
      statusCode: HttpStatus.OK,
      message: '이메일 인증 코드를 전송했습니다.',
    };
  }

  /**
   * 회원가입시 인증 번호 검증
   * @param verifyCodeDto - 사용자 이메일 및 인증 번호 비교
   * @returns 인증 결과 메시지
   */
  @HttpCode(HttpStatus.OK)
  @Post('/verify-code')
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    const { email, verificationCode } = verifyCodeDto;

    const verificationResult = await this.emailService.verifyCode(
      email,
      verificationCode,
    );

    if (verificationResult) {
      return {
        statusCode: HttpStatus.OK,
        message: '인증 성공',
      };
    } else {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: '인증 실패',
      };
    }
  }

  /**
   * 비밀번호 재설정
   * @param resetPasswordDto
   * @returns 비밀번호 재설정 결과 메시지
   */
  @HttpCode(HttpStatus.OK)
  @Post('/reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const { email, newPassword, verificationCode } = resetPasswordDto;

    const verificationResult = await this.emailService.verifyCode(
      email,
      verificationCode,
    );

    if (verificationResult) {
      await this.authService.resetPassword(email, newPassword);

      return {
        statusCode: HttpStatus.OK,
        message: '비밀번호 재설정에 성공했습니다.',
      };
    } else {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: '인증 실패',
      };
    }
  }
}
