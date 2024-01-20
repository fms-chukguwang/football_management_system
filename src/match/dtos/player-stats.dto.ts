import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class createPlayerStatsDto {

    /**
     * 클린시트
     * @example 0
     */
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => value ?? 0)
    clean_sheet: number;

    /**
     * 어시스트
     * @example 3
     */
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => value ?? 0)
    assists: number;

    /**
     * 골
     * @example 1
     */
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => value ?? 0)
    goals: number;

    /**
     * 옐로우카드 수
     * @example 1
     */
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => value ?? 0)
    yellowCards: number;

    /**
     * 레드카드 수
     * @example 0
     */
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => value ?? 0)
    redCards: number;

    /**
     * 교체 수
     * @example 3
     */
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => value ?? 0)
    substitions: number;

    /**
     * 선방  수
     * @example 0
     */
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => value ?? 0)
    save: number;

  }
