import { IsBoolean, IsNumber } from 'class-validator';

export class UpdateMemberInfoDto {
    @IsNumber()
    userId: number;

    @IsBoolean()
    isStaff: boolean;
}
