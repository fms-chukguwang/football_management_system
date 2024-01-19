import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsOptional } from 'class-validator';

export class UpdateMemberInfoDto {
    @IsBoolean()
    @IsOptional()
    @ApiProperty()
    isStaff?: boolean;

    @IsDate()
    @IsOptional()
    @ApiProperty()
    joinDate?: Date;
}
