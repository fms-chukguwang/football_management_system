import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class createMatchResultDto {


    /**
     * 홈팀 승점
     * @example 3
     */
    @IsNumber()
    @IsNotEmpty({ message: '홈팀 승점을 입력해주세요.' }) 
    homeWin: number;

    /**
     * 홈팀 실점
     * @example 1
     */
    @IsNumber()
    @IsNotEmpty({ message: '홈팀 실점을 입력해주세요.' })
    homeLose: number;

    /**
     * 홈팀 무승부 여부
     * @example false
     */
    @IsBoolean()
    @IsNotEmpty({ message: '홈팀 무승부 여부를 입력해주세요.' })
    homeDraw: boolean;

    /**
     * 홈팀 레드카드 수
     * @example 0
     */
    @IsNumber()
    @IsNotEmpty({ message: '홈팀 레드카드 수를 입력해주세요.' })
    homeRedCards: number;

    /**
     * 홈팀 옐로우카드 수
     * @example 1
     */
    @IsNumber()
    @IsNotEmpty({ message: '홈팀 옐로우카드 수를 입력해주세요.' })
    homeYellowCards: number;

    /**
     * 홈팀 교체 수
     * @example 3
     */
    @IsNumber()
    @IsNotEmpty({ message: '홈팀 교체 수를 입력해주세요.' })
    homeSubstitions: number;

    /**
     * 홈팀 선방 수
     * @example 4
     */
    @IsNumber()
    @IsNotEmpty({ message: '홈팀 선방 수를 입력해주세요.' })
    homeSave: number;

    /**
     * 홈팀 가로채기 수
     * @example 7
     */
    @IsNumber()
    @IsNotEmpty({ message: '홈팀 가로채기 수를 입력해주세요.' })
    homeIntercept: number;

    /**
     * 어웨이팀 승점
     * @example 1
     */
    @IsNumber()
    @IsNotEmpty({ message: '어웨이팀 승점을 입력해주세요.' }) 
    awayWin: number;

    /**
     * 어웨이팀 실점
     * @example 3
     */
    @IsNumber()
    @IsNotEmpty({ message: '어웨이팀 실점을 입력해주세요.' })
    awayLose: number;

    /**
     * 어웨이팀 무승부 여부
     * @example false
     */
    @IsBoolean()
    @IsNotEmpty({ message: '어웨이팀 무승부 여부를 입력해주세요.' })
    awayDraw: boolean;

    /**
     * 어웨이팀 레드카드 수
     * @example 0
     */
    @IsNumber()
    @IsNotEmpty({ message: '어웨이팀 레드카드 수를 입력해주세요.' })
    awayRedCards: number;

    /**
     * 어웨이팀 옐로우카드 수
     * @example 0
     */
    @IsNumber()
    @IsNotEmpty({ message: '어웨이팀 옐로우카드 수를 입력해주세요.' })
    awayYellowCards: number;

    /**
     * 어웨이팀 교체 수
     * @example 1
     */
    @IsNumber()
    @IsNotEmpty({ message: '어웨이팀 교체 수를 입력해주세요.' })
    awaySubstitions: number;

    /**
     * 어웨이팀 선방 수
     * @example 4
     */
    @IsNumber()
    @IsNotEmpty({ message: '어웨이팀 선방 수를 입력해주세요.' })
    awaySave: number;

    /**
     * 어웨이팀 가로채기 수
     * @example 7
     */
    @IsNumber()
    @IsNotEmpty({ message: '어웨이팀 가로채기 수를 입력해주세요.' })
    awayIntercept: number;
  }
