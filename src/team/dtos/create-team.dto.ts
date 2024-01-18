import { PickType } from '@nestjs/swagger';
import { TeamModel } from '../entities/team.entity';
import { IsNumber, IsString, Validate, validate } from 'class-validator';
import { stringValidationMessage } from '../validation-message/string-validation.message';
import { ParseIntPipe } from '@nestjs/common';
import { Transform } from 'class-transformer';

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
    address: string;

    @IsNumber()
    @Transform(({ value }) => parseInt(value, 10))
    postalCode: number;
}
