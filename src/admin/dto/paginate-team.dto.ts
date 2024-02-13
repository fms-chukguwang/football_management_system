import { BasePaginationDto } from '../../common/dto/base-pagination.dto';

export class PaginateTeamDto extends BasePaginationDto {
    take: number = 10;
}
