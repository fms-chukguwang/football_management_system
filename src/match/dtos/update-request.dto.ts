import { IsNotEmpty, IsString } from 'class-validator';

export class updateRequestDto {

    @IsString()
    @IsNotEmpty({ message: '예약 변경일자를 입력해주세요.' })
    date: string;
  
    @IsString()
    @IsNotEmpty({ message: '예약 변경시간을 입력해주세요.' })
    time: string;

    @IsString()
    @IsNotEmpty({ message: '사유을 입력해주세요.' })
    reason: string;
  }
