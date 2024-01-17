import { IsIn, IsNumber, IsOptional } from 'class-validator';

export class BasePaginationDto {
  // page기반의 페이지네이션할 때 넣으면 됨
  @IsNumber()
  @IsOptional()
  page?: number;

  // 내림차순으로 정리하고 싶은 경우
  @IsNumber()
  @IsOptional()
  where__id__less_than?: number;

  // 오름차순으로 정리하고 싶은 경우
  @IsNumber()
  @IsOptional()
  where__id__more_than?: number;

  // createdAt: 생성된 날짜의 오름차순/내림차순으로 정렬
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  order__createdAt: 'ASC' | 'DESC' = 'ASC';

  // 몇개의 데이터를 가져올지
  @IsNumber()
  @IsOptional()
  take: number = 30;
}
