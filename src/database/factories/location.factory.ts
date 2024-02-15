import { LocationModel } from '../../location/entities/location.entity';
import { setSeederFactory } from 'typeorm-extension';

export default setSeederFactory(LocationModel, (faker) => {
    const location = new LocationModel();
    location.latitude = faker.location.latitude();
    location.longitude = faker.location.longitude();
    location.state = faker.location.state();
    location.city = faker.location.city();
    location.district = faker.location.county();
    location.address = faker.location.streetAddress();
    location.createdAt = new Date();
    location.updatedAt = new Date();
    location.deletedAt = null;
    return location;
});
