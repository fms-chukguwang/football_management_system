import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SoccerFieldModel } from './entities/soccerfield.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class SoccerfieldService {
    constructor(private readonly dataSource: DataSource) {}
    /**
     * 경기장 가져오기
     */
    async findOneStadium(soccer_field_id: number) {
        const stadium = await this.dataSource
            .getRepository(SoccerFieldModel)
            .createQueryBuilder('soccer_fields')
            .where('soccer_fields.id = :id', { id: soccer_field_id })
            .getOne();
        console.log('stadium', stadium);
        return stadium;
    }
}
