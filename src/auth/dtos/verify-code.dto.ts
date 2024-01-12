import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class VerifyCodeDto {
  @ApiProperty({ example: 'user@example.com', description: '이메일 주소' })
  @IsEmail()
  readonly email: string;

  @ApiProperty({ example: '123456', description: '인증 코드' })
  @IsString()
  readonly verificationCode: string;
}
