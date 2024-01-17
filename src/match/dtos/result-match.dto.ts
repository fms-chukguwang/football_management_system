import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class createMatchResultDto {


    /**
     * 승점
     * @example 3
     */
    @IsNumber()
    @IsNotEmpty({ message: '승점을 입력해주세요.' }) 
    win: number;

    /**
     * 실점
     * @example 1
     */
    @IsNumber()
    @IsNotEmpty({ message: '실점을 입력해주세요.' })
    lose: number;

    /**
     * 무승부 여부
     * @example false
     */
    @IsBoolean()
    @IsNotEmpty({ message: '무승부 여부를 입력해주세요.' })
    draw: boolean;

    /**
     * 레드카드 수
     * @example 0
     */
    @IsNumber()
    @IsNotEmpty({ message: '레드카드 수를 입력해주세요.' })
    redCards: number;

    /**
     * 옐로우카드 수
     * @example 1
     */
    @IsNumber()
    @IsNotEmpty({ message: '옐로우카드 수를 입력해주세요.' })
    yellowCards: number;

    /**
     * 교체 수
     * @example 3
     */
    @IsNumber()
    @IsNotEmpty({ message: '교체 수를 입력해주세요.' })
    substitions: number;

    /**
     * 선방 수
     * @example 4
     */
    @IsNumber()
    @IsNotEmpty({ message: '선방 수를 입력해주세요.' })
    save: number;

    /**
     * 가로채기 수
     * @example 7
     */
    @IsNumber()
    @IsNotEmpty({ message: '가로채기 수를 입력해주세요.' })
    intercept: number;
  }
