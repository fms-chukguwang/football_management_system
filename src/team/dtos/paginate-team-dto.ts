import { IsOptional, IsString } from 'class-validator';
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


    @IsString()
    @IsOptional()
    isMixed?:boolean;
}