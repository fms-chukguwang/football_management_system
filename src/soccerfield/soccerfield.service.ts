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

    /**
     * 경기장 전체 조회
     * @returns
     */
    async findAllStadium(userId: number, dto: PaginateFieldDto, name?: string) {

        // const queryOptions = {
        //     relations: {
        //         locationfield: true,
        //     },
        //     select: {
        //         locationfield: {
        //             address: true,
        //             state: true,
        //             city: true,
        //             district: true,
        //         },
        //     },
        // };
    
        // // name 값이 제공되었다면 where 조건 추가
        // if (name) {
        //     queryOptions['where'] = {
        //         field_name: Like(`%${name}%`)
        //     };
        // }

        // const soccerField = await this.soccerFieldRepository.find(queryOptions);

        console.log('dto:',dto);
        console.log('name:',name);

        const options: FindManyOptions<SoccerField> = {
            relations: {
                locationfield: true,
            }
        };

        if (name) {
            options.where = {  field_name: Like(`%${name}%`)  };
        }
        

        if (!options) {
            throw new NotFoundException('등록된 경기장 목록이 없습니다.');
        }

        //return soccerField;
        return await this.commonService.paginate(dto, this.soccerFieldRepository, options, 'soccerfield');
    }
}
