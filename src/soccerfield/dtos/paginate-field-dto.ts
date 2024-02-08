import { IsOptional, IsString } from 'class-validator';
import { BasePaginationDto } from '../../common/dto/base-pagination.dto';

export class PaginateFieldDto extends BasePaginationDto {
    take = 8; // 가져오고 싶은 숫자만큼

    @IsString()
    @IsOptional()
    name?:string;
}