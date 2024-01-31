import { IsIn, IsNumber, IsOptional } from 'class-validator';
import { BasePaginationDto } from '../../common/dto/base-pagination.dto';


export class PaginateMessageDto extends BasePaginationDto {
    @IsIn(['ASC', 'DESC'])
    @IsOptional()
    order__createdAt: 'ASC' | 'DESC' = 'DESC';
}
