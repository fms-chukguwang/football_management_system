import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  /**
   * 이메일
   * @example "example@example.com"
   */
  @IsEmail()
  email: string;
  /**
   * 새로운 비밀번호
   * @example "Ex@mp1e!!"
   */
  @IsString()
  @IsNotEmpty()
  newPassword: string;
  /**
   * 인증코드
   * @example "123456"
   */
  @IsString()
  @IsNotEmpty()
  verificationCode: string;
}
