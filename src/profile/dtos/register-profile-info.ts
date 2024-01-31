import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Position } from '../../enums/position.enum';
import { Gender } from '../../enums/gender.enum';
import { Column } from 'typeorm';

export class RegisterProfileInfoDto {
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
}
