import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class VerifyKakaoCodeDto {

  @ApiProperty({ example: 123456, description: '인증 코드' })
  @IsNumber()
  readonly code: number;
}
