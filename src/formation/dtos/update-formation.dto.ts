import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class PlayerPosition {
    @IsNumber()
    id: number;
  
    @IsString()
    name: string;
  
    @IsString()
    position: string;
  }

export class UpdateFormationDto {

    @IsString()
    @IsNotEmpty({ message: '예약 변경일자를 입력해주세요.' })
    currentFormation: string;
  
    /**
     * 멤버별 기록
     * @example [{'id':1,'name':'홍길동','position':'GK'}]
     */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PlayerPosition)
    @IsOptional()
    playerPositions: PlayerPosition[];
  }
