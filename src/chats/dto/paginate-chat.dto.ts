import { IsIn, IsNumber, IsOptional } from 'class-validator';

export class PaginateChatDto {
  // page기반의 페이지네이션
  @IsNumber()
  @IsOptional()
  page?: number;

  // 내림차순으로 정리하고 싶은 경우
  @IsNumber()
  @IsOptional()
  where__id__less_than?: number;

  // 이전 마지막 데이터의 ID
  // 이 프로퍼티에 입력된 ID 보다 높은 ID 부터 값을 갖고 온다.
  @IsNumber()
  @IsOptional()
  where__id__more_than?: number;

  // 정렬
  // createdAt: 생성된 날짜의 오름차순/내림차순으로 정렬
  @IsIn(['ASC', 'DESC']) // 무조건 ASC만 들어올 수 있도록
  @IsOptional()
  order__createdAt: 'ASC' | 'DESC' = 'ASC';

  // 몇개의 데이터를 가져올지
  @IsNumber()
  @IsOptional()
  take: number = 80;
}
