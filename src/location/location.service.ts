import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LocationModel } from './entities/location.entity';
import { Repository } from 'typeorm';
import { CreateAddressDto } from './dtos/create-address.dto';

@Injectable()
export class LocationService {
    constructor(
        @InjectRepository(LocationModel)
        private readonly locationRepository: Repository<LocationModel>,
    ) {}

    /**
     * 주소 추출하기
     * @param address
     */
    extractAddress(address: string): CreateAddressDto {
        const splitAddress = address.split(' ');

        return {
            state: splitAddress[0],
            city: splitAddress[1],
            district: splitAddress[2],
        };
    }

    /**
     * 지역 가져오기
     */
    findOneLocation(dto: CreateAddressDto): Promise<LocationModel> {
        return this.locationRepository.findOne({
            where: {
                state: dto.state,
                city: dto.city,
                district: dto.district,
            },
        });
    }

    /**
     * 지역 등록하기
     */
    registerLocation(
        address: string,
        extractLocation: CreateAddressDto,
    ): Promise<LocationModel> {
        return this.locationRepository.save({
            address,
            ...extractLocation,
        });
    }
}
