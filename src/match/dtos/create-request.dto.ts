import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class createRequestDto {

    @IsString()
    @IsNotEmpty({ message: '경기 예약일자를 입력해주세요.' })
    date: string;
  
    @IsString()
    @IsNotEmpty({ message: '경기 예약시간을 입력해주세요.' })
    time: string;

    @IsNumber()
    @IsNotEmpty({ message: '홈팀을 입력해주세요.' })
    homeTeamId: number;

    @IsNumber()
    @IsNotEmpty({ message: '어웨이팀을 입력해주세요.' })
    awayTeamId: number;

    @IsNumber()
    @IsNotEmpty({ message: '경기장을 입력해주세요.' })
    fieldId: number;
  }
