import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class createRequestDto {

    /**
     * 예약일자
     * @example "2024-01-25"
     */
    @IsString()
    @IsNotEmpty({ message: '경기 예약일자를 입력해주세요.' })
    date: string;
  
    /**
     * 예약시간
     * @example "17:00:00"
     */
    @IsString()
    @IsNotEmpty({ message: '경기 예약시간을 입력해주세요.' })
    time: string;

    /**
     * 홈팀
     * @example 15
     */
    @IsNumber()
    @IsNotEmpty({ message: '홈팀을 입력해주세요.' })
    homeTeamId: number;

    /**
     * 어웨이팀
     * @example 12
     */
    @IsNumber()
    @IsNotEmpty({ message: '어웨이팀을 입력해주세요.' })
    awayTeamId: number;

    /**
     * 경기장
     * @example 5
     */
    @IsNumber()
    @IsNotEmpty({ message: '경기장을 입력해주세요.' })
    fieldId: number;
  }
