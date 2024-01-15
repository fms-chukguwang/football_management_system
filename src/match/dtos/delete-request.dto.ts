import { IsNotEmpty, IsString } from 'class-validator';

export class deleteRequestDto {
    @IsString()
    @IsNotEmpty({ message: '사유을 입력해주세요.' })
    reason: string;
  }
