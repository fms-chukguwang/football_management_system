import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class createMatchDto {

    @IsString()
    @IsNotEmpty({ message: '경기 예약일자를 입력해주세요.' })
    date: string;
  
    @IsString()
    @IsNotEmpty({ message: '경기 예약시간을 입력해주세요.' })
    time: string;

    @IsString()
    @IsNotEmpty({ message: '홈팀을 입력해주세요.' })
    homeTeamId: string;

    @IsString()
    @IsNotEmpty({ message: '어웨이팀을 입력해주세요.' })
    awayTeamId: string;

    
    @IsString()
    @IsNotEmpty({ message: '경기장을 입력해주세요.' })
    fieldId: string;

    /**
     * token
     * @example Bearer token
     */
    @IsString()
    @IsNotEmpty({ message: '토큰 값이 없습니다.' })
    token: string;
  }
