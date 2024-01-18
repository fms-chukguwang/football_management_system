import { IsNotEmpty, IsString } from 'class-validator';

export class deleteMatchDto {
    @IsString()
    @IsNotEmpty({ message: '사유을 입력해주세요.' })
    reason: string;

    @IsString()
    @IsNotEmpty({ message: '토큰 값이 없습니다.' })
    token: string;
  }
