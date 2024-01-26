import { IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ResultMemberDto {
  @IsNumber()
  memberId: number;

  @IsNumber()
  assists: number;

  @IsNumber()
  goals: number;

  @IsNumber()
  yellowCards: number;

  @IsNumber()
  redCards: number;

  @IsNumber()
  save: number;
}

export class ResultMembersDto{
    /**
     * 멤버별 기록
     * @example [{'memberId':1,'assists':2,'goals':0,'yellowCards':0,'redCards':0,'save':0}]
     */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ResultMemberDto)
    @IsOptional()
    results: ResultMemberDto[];
  
  }