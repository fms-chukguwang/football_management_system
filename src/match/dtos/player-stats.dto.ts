import { IsNotEmpty, IsNumber } from 'class-validator';

export class createPlayerStatsDto {


    /**
     * 어시스트
     * @example 3
     */
    @IsNumber()
    @IsNotEmpty({ message: '어시스트를 입력해주세요.' }) 
    assists: number;

    /**
     * 골
     * @example 1
     */
    @IsNumber()
    @IsNotEmpty({ message: '골 수를 입력해주세요.' })
    goals: number;

    /**
     * 헤딩
     * @example 0
     */
    @IsNumber()
    @IsNotEmpty({ message: '헤딩수를 입력해주세요.' })
    headings: number;

    /**
     * 옐로우카드 수
     * @example 1
     */
    @IsNumber()
    @IsNotEmpty({ message: '옐로우카드 수를 입력해주세요.' })
    yellowCards: number;

    /**
     * 레드카드 수
     * @example 0
     */
    @IsNumber()
    @IsNotEmpty({ message: '레드카드 수를 입력해주세요.' })
    redCards: number;

    /**
     * 교체 수
     * @example 3
     */
    @IsNumber()
    @IsNotEmpty({ message: '교체 수를 입력해주세요.' })
    substitions: number;

    /**
     * 선방 수
     * @example 1
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
    intercepts: number;

    /**
     * 패스 수
     * @example 7
     */
    @IsNumber()
    @IsNotEmpty({ message: '패스 수를 입력해주세요.' })
    pass: number;

    /**
     * 패스성공 수
     * @example 6
     */
    @IsNumber()
    @IsNotEmpty({ message: '패스성공 수를 입력해주세요.' })
    passSuccess: number;

    /**
     * 헤딩성공 수
     * @example 7
     */
    @IsNumber()
    @IsNotEmpty({ message: '헤딩성공 수를 입력해주세요.' })
    headingSuccess: number;

    /**
     * 슈팅성공 수
     * @example 3
     */
    @IsNumber()
    @IsNotEmpty({ message: '슈팅성공 수를 입력해주세요.' })
    shootingSuccess: number;

    /**
     * 슈팅 수
     * @example 7
     */
    @IsNumber()
    @IsNotEmpty({ message: '슈팅 수를 입력해주세요.' })
    shooting: number;
  }
