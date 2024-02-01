import { DataFactory, Seeder } from 'nestjs-seeder';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationModel } from '../location/entities/location.entity';

@Injectable()
export class LocationSeed implements Seeder {
  constructor(
    @InjectRepository(LocationModel)
    private locationRepository: Repository<LocationModel>,
  ) {}

  seed(): Promise<any> {
    const location = DataFactory.createForClass(LocationModel).generate(50);

    return this.locationRepository.insert(location);
  }
  drop(): Promise<any> {
    return this.locationRepository.delete({});
  }
}
