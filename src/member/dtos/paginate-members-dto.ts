import { IsOptional, IsString } from 'class-validator';
import { BasePaginationDto } from '../../common/dto/base-pagination.dto';

export class PaginateMembersDto extends BasePaginationDto {
    take = 5; // 가져오고 싶은 숫자만큼

    @IsString()
    @IsOptional()
    name?:string;
}