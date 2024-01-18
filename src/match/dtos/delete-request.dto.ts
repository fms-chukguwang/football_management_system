import { IsNotEmpty, IsString } from 'class-validator';

export class deleteRequestDto {

    /**
     * 사유
     * @example "악천우 예상으로 일정 취소"
     */
    @IsString()
    @IsNotEmpty({ message: '사유을 입력해주세요.' })
    reason: string;
  }
