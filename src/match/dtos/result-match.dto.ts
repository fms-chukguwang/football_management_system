import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class userCountDto {

  @IsNotEmpty({ message: '선수를 입력해주세요.' })
  playerId: number;

  @IsNotEmpty({ message: '횟수 입력해주세요.' })
  count: number;
}

export class substitionsDto {

  @IsNotEmpty({ message: '교체 투입선수를 입력해주세요.' })
  inPlayerId: number;

  @IsNotEmpty({ message: '교체후 들어간 선수 입력해주세요.' })
  outPlayerId: number;

}


export class createMatchResultDto {

    /**
     * 골
     * @example [{'playerId':1,'count':2},{'playerId':2,'count':1}]
     */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => userCountDto)
    @IsOptional()
    goals: userCountDto[];

    /**
     * 코너킥
     * @example 5
     */
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => value ?? 0)
    cornerKick: number;

    /**
     * 레드카드
     * @example []
     */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => userCountDto)
    @IsOptional()
    redCards: userCountDto[];

    /**
     * 옐로우카드
     * @example [1, 2, 3, 4]
     */
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    yellowCards: number[];

    /**
     * 교체
     * @example [{'inPlayerId':2,'outPlayerId':1}]
     */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => substitionsDto)
    @IsOptional()
    substitions: substitionsDto[];

    /**
     * 선방
     * @example [{'playerId':3,'count':1}]
     */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => userCountDto)
    @IsOptional()
    saves: userCountDto[];

    /**
     * 어시스트
     * @example [{'playerId':3,'count':2},{'playerId':2,'count':1}]
     */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => userCountDto)
    @IsOptional()
    assists: userCountDto[];

    /**
     * 패스
     * @example 150
     */
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => value ?? 0)
    passes: number;

    /**
     * 패널티킥 
     * @example 0
     */
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => value ?? 0)
    penaltyKick: number;

    /**
     * 프리킥
     * @example 6
     */
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => value ?? 0)
    freeKick: number;
  }
