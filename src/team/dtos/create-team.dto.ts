import { PickType } from '@nestjs/swagger';
import { TeamModel } from '../entities/team.entity';
import { IsNotEmpty, IsNumber, IsString, Validate, validate } from 'class-validator';
import { stringValidationMessage } from '../validation-message/string-validation.message';
import { ParseIntPipe } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { Factory } from 'nestjs-seeder';
import { Column } from 'typeorm';

export class CreateTeamDto extends PickType(TeamModel, [
    'name',
    'description',
    'gender',
    'isMixedGender',
]) {
    @IsString({
        message: stringValidationMessage,
    })
    @Transform(({ value }) => value.toString())
    @Column()
    address: string;

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
}
