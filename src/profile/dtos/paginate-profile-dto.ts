import { BasePaginationDto } from '../../common/dto/base-pagination.dto';

export class PaginateProfileDto extends BasePaginationDto {
    take = 5; // 가져오고 싶은 숫자만큼
}