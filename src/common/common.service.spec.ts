import { Test, TestingModule } from '@nestjs/testing';
import { CommonService } from './common.service';
import { BadRequestException } from '@nestjs/common';
import { FindOperator, Repository } from 'typeorm';
import exp from 'constants';

describe('CommonService', () => {
    let service: CommonService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CommonService],
        }).compile();

        service = module.get<CommonService>(CommonService);
    });

    describe('parseOrderFilter', () => {
        it('통과 케이스', () => {
            const key = 'order__createdAt';
            const value = 'ASC';
            const result = service['parseOrderFilter'](key, value);
            console.log('parseOrderFilter', result);
            expect(result).toHaveProperty('createdAt', 'ASC');
        });

        it('실패 케이스 _ split 길이가 2가 아닌 경우', () => {
            const key = 'where__id__less_than';
            const value = 30;
            expect(() => service['parseOrderFilter'](key, value)).toThrow(
                new BadRequestException(
                    `order 필터는 '__'로 split 했을 때 길이가 2여야 합니다. - 문제되는 키값 : ${key}`,
                ),
            );
        });
    });

    // describe('private parseWhereFilter<T extends BaseModel>(key: string, value: any) 테스트 ', () => {
    //     it('split length === 3', () => {
    //         const key = 'where__id__less_than';
    //         const value = 30;
    //         const result = service['parseWhereFilter'](key, value);
    //         const expected = {};
    //     });
    // });

    describe('paginate 테스트', () => {
        let mockRepository: Repository<any>;
        it('성공', async () => {
            const mockReturn = [
                [
                    {
                        id: 1,
                        message: 'test1',
                        createdAt: new Date(),
                    },
                    {
                        id: 2,
                        message: 'test2',
                        createdAt: new Date(),
                    },
                ],
                2,
            ];
            const dto = {
                order__createdAt: 'ASC' as 'ASC' | 'DESC',
                take: 30,
                page: 1,
            };
            mockRepository = {
                findAndCount: jest.fn().mockReturnValue(mockReturn),
            } as any;
            const overrideFindOptions = {};
            const path = 'test';
            const expectedReturn = {
                data: [
                    {
                        id: 1,
                        message: 'test1',
                        createdAt: new Date(),
                    },
                    {
                        id: 2,
                        message: 'test2',
                        createdAt: new Date(),
                    },
                ],
                total: 2,
            };
            const result = await service.paginate(dto, mockRepository, overrideFindOptions, path);
            expect(result).toEqual(expectedReturn);
        });
    });

    describe('compoeseFindOptions', () => {
        it('통과 케이스 _ order__createdAt', () => {
            const dto = {
                order__createdAt: 'ASC' as 'ASC' | 'DESC',
                take: 30,
            };
            const result = service['compoeseFindOptions'](dto);
            expect(result).toHaveProperty('where', {});
            expect(result).toHaveProperty('order', { createdAt: 'ASC' });
            expect(result).toHaveProperty('take', 30);
        });

        // it('통과 케이스 _ where__id__less_than', () => {
        //     const dto = {
        //         order__createdAt: 'ASC' as 'ASC' | 'DESC',
        //         where__id__less_than: 30,
        //         take: 30,
        //     };
        //     const result = service['compoeseFindOptions'](dto);
        // });
    });

    describe('pagePagination 테스트', () => {
        let mockRepository: Repository<any>;
        it('성공 테스트', async () => {
            const mockReturn = [
                [
                    {
                        id: 1,
                        message: 'test1',
                        createdAt: new Date(),
                    },
                    {
                        id: 2,
                        message: 'test2',
                        createdAt: new Date(),
                    },
                ],
                2,
            ];

            const expectedReturn = {
                data: [
                    {
                        id: 1,
                        message: 'test1',
                        createdAt: new Date(),
                    },
                    {
                        id: 2,
                        message: 'test2',
                        createdAt: new Date(),
                    },
                ],
                total: 2,
            };

            const dto = {
                order__createdAt: 'ASC' as 'ASC' | 'DESC',
                take: 1,
                page: 1,
            };

            mockRepository = {
                findAndCount: jest.fn().mockResolvedValue(mockReturn),
            } as any;

            const overrideFindOptions = {};

            const result = await service['pagePagination'](
                dto,
                mockRepository,
                overrideFindOptions,
            );
            console.log('result', result);
            expect(result).toEqual(expectedReturn);
        });
    });

    // describe('cursorPagination', () => {
    //     let mockRepository: Repository<any>;
    //     it('통과 케이스', async () => {
    //         const mockReturn = [
    //             {
    //                 id: 1,
    //                 message: 'test1',
    //                 createdAt: new Date(),
    //             },
    //             {
    //                 id: 2,
    //                 message: 'test2',
    //                 createdAt: new Date(),
    //             },
    //         ];
    //         mockRepository = {
    //             find: jest.fn().mockResolvedValue(mockReturn),
    //         } as any;
    //         const dto = {
    //             order__createdAt: 'DESC' as 'ASC' | 'DESC',
    //             take: 1,
    //         };
    //         const overrideFindOptions = {};
    //         const path = 'test';
    //         const expectedResult = {
    //             data: [mockReturn[0]],
    //             cursor: {
    //                 after: 1,
    //             },
    //             count: 2,
    //             // next: '',
    //         };

    //         const result = await service['cursorPagination'](
    //             dto,
    //             mockRepository,
    //             overrideFindOptions,
    //             path,
    //         );

    //         console.log('result', result);
    //         delete result.next;
    //         expect(result).toEqual(expectedResult);
    //     });
    // });
});
