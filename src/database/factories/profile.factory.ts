import { Gender } from '../../enums/gender.enum';
import { Position } from '../../enums/position.enum';
import { Profile } from '../../profile/entities/profile.entity';
import { setSeederFactory } from 'typeorm-extension';

export default setSeederFactory(Profile, (faker) => {
    const profile = new Profile();
    profile.weight = faker.number.int({ min: 50, max: 100 });
    profile.height = faker.number.int({ min: 150, max: 200 });
    profile.skillLevel = faker.number.int({ min: 1, max: 10 });
    profile.preferredPosition = faker.helpers.arrayElement(Object.values(Position));
    profile.imageUUID = '2a9d4d63-0619-4abc-8d9c-c4eba2f227b6';
    profile.age = faker.number.int({ min: 18, max: 40 });
    profile.createdAt = new Date();
    profile.updatedAt = new Date();
    profile.deletedAt = null;
    profile.gender = faker.helpers.arrayElement(Object.values(Gender));
    return profile;
});
