import { IsString, IsEmail, IsOptional } from 'class-validator';
import { Gender } from 'src/enums/gender.enum';
import { Position } from 'src/user/types/position.type';

export class UpdatePlayerInfoDto {
  /**
   * 선수 이름
   * @example "김메시"
   */

  @IsString()
  @IsOptional()
  name: string;

  /**
   * 실력
   * @example "9"
   */
  @IsOptional()
  skill_level: number;

  /**
   * 몸무게
   * @example "59"
   */
  @IsOptional()
  weight: number;

  /**
   * 키
   * @example "159"
   */
  @IsOptional()
  height: number;

  /**
   * 포지션
   * @example "우측 윙어"
   */
  @IsOptional()
  position: Position;

  /**
   * 사진 url
   * @example "사진url"
   */
  @IsOptional()
  @IsString()
  imageUrl: string;

  /**
   * 나이
   * @example "18"
   */
  @IsOptional()
  age: number;

  /**
   * 휴대폰 번호
   * @example "010-000-0000"
   */
  @IsOptional()
  @IsString()
  phone: string;

  /**
   * 생년월일
   * @example "7001010"
   */
  @IsOptional()
  birthdate: Date;

  /**
   * 성별
   * @example "Male"
   */
  @IsOptional()
  gender: Gender;

  /**
   * 위치
   * @example "Location_id"
   */
}
