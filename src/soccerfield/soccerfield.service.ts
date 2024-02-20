import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SoccerFieldModel } from './entities/soccerfield.entity';
import { DataSource, FindManyOptions, Like, Repository } from 'typeorm';
import { PaginateFieldDto } from './dtos/paginate-field-dto';
import { CommonService } from '../common/common.service';
import { SoccerField } from '../match/entities/soccer-field.entity';

@Injectable()
export class SoccerfieldService {
    constructor(
        @InjectRepository(SoccerField)
        private soccerFieldRepository: Repository<SoccerField>,
        private readonly dataSource: DataSource,
        private readonly commonService: CommonService
    ) {}

    async findOneStadium(soccer_field_id: number) {
        const stadium = await this.dataSource
            .getRepository(SoccerFieldModel)
            .createQueryBuilder('soccer_fields')
            .where('soccer_fields.id = :id', { id: soccer_field_id })
            .getOne();
        return stadium;
    }

    async findAllStadium(userId: number, dto: PaginateFieldDto, region?: string, name?: string) {
        const options: FindManyOptions<SoccerField> = {
            relations: ['locationfield'],
        };

        // 이름 필터링
        if (name) {
            options.where = { field_name: Like(`%${name}%`) };
        }

        // 지역 필터링
        if (region) {
            options.where = {
                ...options.where,
                locationfield: {
                    state: region
                }
            };
        }

        // 페이지네이션 처리 및 필터링된 결과 반환
        return await this.commonService.paginate(dto, this.soccerFieldRepository, options, 'soccerfield');
    }
}
