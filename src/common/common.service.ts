import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseModel } from './entities/base.entity';
import { BasePaginationDto } from './dto/base-pagination.dto';
import { FindManyOptions, FindOptionsOrder, FindOptionsWhere, Repository } from 'typeorm';
import { OPERATOR } from './const/operator.const';

@Injectable()
export class CommonService {
    async paginate<T extends BaseModel>(
        dto: BasePaginationDto,
        repsitory: Repository<T>,
        overrideFindOptions: FindManyOptions<T>,
        path: string,
    ) {
        if (dto.page) {
            // page 기반 pagination
            return await this.pagePagination(dto, repsitory, overrideFindOptions);
        } else {
            // cursor 기반 pagination
            return await this.cursorPagination(dto, repsitory, overrideFindOptions, path);
        }
    }

    private async pagePagination<T extends BaseModel>(
        dto: BasePaginationDto,
        repository: Repository<T>,
        overrideFindOptions: FindManyOptions<T>,
    ) {
        const findOptions = this.compoeseFindOptions<T>(dto);
        const [data, count] = await repository.findAndCount({
            ...findOptions,
            ...overrideFindOptions,
        });
        return {
            data,
            total: count,
        };
    }

    private async cursorPagination<T extends BaseModel>(
        dto: BasePaginationDto,
        repository: Repository<T>,
        overrideFindOptions: FindManyOptions<T>,
        path: string,
    ) {
        const findOptions = this.compoeseFindOptions<T>(dto);
        const result = await repository.find({
            ...findOptions,
            ...overrideFindOptions,
        });

        const lastItem =
            result.length > 0 && result.length === dto.take ? result[result.length - 1] : null;

        // nextUrl 만들기
        const nextUrl = lastItem && new URL(`http://localhost:3000/api/${path}`);
        if (nextUrl) {
            for (const key of Object.keys(dto)) {
                if (dto[key]) {
                    if (key !== 'where__id__more_than' && key !== 'where__id__less_than') {
                        nextUrl.searchParams.append(key, dto[key]); // url의 쿼리파라미터는 무조건 string
                    }
                }
            }
            let key = null;
            if (dto.order__createdAt === 'ASC') {
                key = 'where__id__more_than';
            } else {
                key = 'where__id__less_than';
            }
            nextUrl.searchParams.append(key, lastItem.id.toString());
        }

        return {
            data: result,
            cursor: {
                after: lastItem?.id ?? null,
            },
            count: result.length,
            next: nextUrl?.toString() ?? null,
        };
    }

    private compoeseFindOptions<T extends BaseModel>(dto: BasePaginationDto): FindManyOptions<T> {
        let where: FindOptionsWhere<T> = {};
        let order: FindOptionsOrder<T> = {};

        for (const [key, value] of Object.entries(dto)) {
            if (key.startsWith('where__')) {
                where = {
                    ...where,
                    ...this.parseWhereFilter(key, value),
                };
            } else if (key.startsWith('order__')) {
                order = {
                    ...order,
                    ...this.parseOrderFilter(key, value),
                };
            }
        }
        return {
            where,
            order,
            take: dto.take,
            skip: dto.page ? dto.take * (dto.page - 1) : null,
        };
    }
    private parseWhereFilter<T extends BaseModel>(key: string, value: any): FindOptionsWhere<T> {
        const options: FindOptionsWhere<T> = {};
        const split = key.split('__');
        if (split.length !== 2 && split.length !== 3) {
            throw new BadRequestException(
                `where 필터는 __로 split 했을 때 길이가 2 또는 3이어야 합니다. - 문제가 발생한 키값 ${key}`,
            );
        }

        if (split.length === 2) {
            // where__id = 3
            //   {
            //     where : {
            //         id: 3
            //     }
            //    }

            const [_, field] = split;
            options[field] = value;
        } else {
            const [_, field, operator] = split;
            if (operator === 'i_like') {
                options[field] = OPERATOR[operator](`%${value}%`);
            } else {
                options[field] = OPERATOR[operator](value);
            }
        }
        return options;
    }

    private parseOrderFilter<T extends BaseModel>(key: string, value: any): FindOptionsOrder<T> {
        const order: FindOptionsOrder<T> = {};
        const split = key.split('__');
        if (split.length !== 2) {
            throw new BadRequestException(
                `order 필터는 '__'로 split 했을 때 길이가 2여야 합니다. - 문제되는 키값 : ${key}`,
            );
        }
        const [_, field] = split;

        order[field] = value;
        return order;
    }
}
