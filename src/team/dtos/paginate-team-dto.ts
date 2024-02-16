import { Transform } from 'class-transformer';
import { IsBooleanString, IsOptional, IsString } from 'class-validator';
import { IsBoolean } from 'src/common/decorators/is-boolean';
import { transform } from 'typescript';
import { BasePaginationDto } from '../../common/dto/base-pagination.dto';

export class PaginateTeamDto extends BasePaginationDto {
    take = 5; // 가져오고 싶은 숫자만큼

    @IsString()
    @IsOptional()
    name?:string;

    @IsString()
    @IsOptional()
    gender?:string;


    @IsString()
    @IsOptional()
    region?:string;


    @IsBoolean()
    @IsOptional()
    isMixedGender?:boolean;
}