import { IsString, IsEmail, IsOptional } from 'class-validator';

export class UpdateMyInfoDto {
  /**
   * 이름
   * @example "홍길동"
   */
   @IsString()
   @IsOptional()
   name: string;

  /**
   * 이메일
   * @example "example@example.com"
   */
   @IsEmail({}, { message: '이메일 형식에 맞지 않습니다.' })
  @IsOptional()
  email: string;
}