import { LocationModel } from '../../location/entities/location.entity';
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';

export default class LocationSeeder implements Seeder {
    public async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
        const locationRepository = dataSource.getRepository(LocationModel);
    }
}
