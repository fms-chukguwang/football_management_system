import { IsEmail } from 'class-validator';

export class PasswordResetUserDto {
  /**
   * 이메일
   * @example "example@example.com"
   */
  @IsEmail({}, { message: '이메일 형식에 맞지 않습니다.' })
  email: string;
}
