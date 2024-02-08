import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Position } from '../../enums/position.enum';
import { Gender } from '../../enums/gender.enum';
import { Column } from 'typeorm';
import { Factory } from 'nestjs-seeder';
import { Transform } from 'class-transformer';
import { stringValidationMessage } from 'src/team/validation-message/string-validation.message';

export class RegisterProfileInfoDto {
      /**
     * 위도
     * @example 37.5665
     */
       @IsNumber()
       @IsNotEmpty({ message: 'Please provide latitude' })
       latitude: number;
   
       /**
        * 경도
        * @example 126.9780
        */
       @IsNumber()
       @IsNotEmpty({ message: 'Please provide longitude' })
       longitude: number;


    /**
     * 포지션
     * @example "Center Back"
     */
    @IsEnum(Position, { message: 'Please provide a valid position value' })
    @IsNotEmpty({ message: 'Preferred position is required' })
    preferredPosition: Position;

    /**
     * 몸무게
     * @example 59
     */
    @IsNumber()
    @IsNotEmpty({ message: 'Please provide weight' })
    weight: number;

    /**
     * 키
     * @example 159
     */
    @IsNumber()
    @IsNotEmpty({ message: 'Please provide height' })
    height: number;

    /**
     * 나이
     * @example 18
     */
    @IsNumber()
    @IsNotEmpty({ message: 'Please provide age' })
    age: number;

    /**
     * 성별
     * @example "Male"
     */
    @IsEnum(Gender, { message: 'Please provide a valid gender value' })
    @IsNotEmpty({ message: 'Please provide gender' })
    gender: Gender;

     /**
     * 지역
     * @example "경기"
     */
      @IsString({
            message: stringValidationMessage,
        })
        @Transform(({ value }) => value.toString())
      @Factory((faker) => faker.location.state())
      @Column()
      state: string;
  
      /**
       * 도시
       * @example "수원시"
       */
       @IsString({
            message: stringValidationMessage,
        })
        @Transform(({ value }) => value.toString())
      @Factory((faker) => faker.location.city())
      @Column()
      city: string;
  
      /**
       * 구
       * @example "권선구"
       */
       @IsString({
            message: stringValidationMessage,
        })
        @Transform(({ value }) => value.toString())
      @Column()
      @Factory((faker) => faker.location.county())
      district: string;
  
      /**
       * 주소
       * @example "경기 수원시 권선구"
       */
       @IsString({
            message: stringValidationMessage,
        })
        @Transform(({ value }) => value.toString())
      @Column()
      @Factory((faker) => faker.location.street())
      address: string;
}
