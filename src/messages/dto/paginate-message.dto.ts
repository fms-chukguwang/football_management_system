import { BasePaginationDto } from 'src/common/dto/base-pagination.dto';

export class PaginateMessageDto extends BasePaginationDto {
    order__createdAt: 'ASC' | 'DESC' = 'DESC';

    take: number = 20;
}
