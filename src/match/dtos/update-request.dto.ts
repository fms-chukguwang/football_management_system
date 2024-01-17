import { IsNotEmpty, IsString } from 'class-validator';

export class updateRequestDto {

    /**
     * 예약 변경일자
     * @example "2024-01-29"
     */
    @IsString()
    @IsNotEmpty({ message: '예약 변경일자를 입력해주세요.' })
    date: string;
  
    /**
     * 예약 변경시간
     * @example "14:00:00"
     */
    @IsString()
    @IsNotEmpty({ message: '예약 변경시간을 입력해주세요.' })
    time: string;

    /**
     * 사유
     * @example "기상 악화로 인한 일정 변경"
     */
    @IsString()
    @IsNotEmpty({ message: '사유을 입력해주세요.' })
    reason: string;
  }
