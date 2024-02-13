import { Gender } from 'src/enums/gender.enum';
import { Position } from 'src/enums/position.enum';
import { Profile } from 'src/profile/entities/profile.entity';
import { setSeederFactory } from 'typeorm-extension';

export default setSeederFactory(Profile, (faker) => {
    const profile = new Profile();
    profile.weight = faker.number.int({ min: 50, max: 100 });
    profile.height = faker.number.int({ min: 150, max: 200 });
    profile.skillLevel = faker.number.int({ min: 1, max: 10 });
    profile.preferredPosition = faker.helpers.arrayElement(Object.values(Position));
    profile.imageUUID = faker.image.url();
    profile.age = faker.number.int({ min: 18, max: 40 });
    profile.createdAt = new Date();
    profile.updatedAt = new Date();
    profile.deletedAt = null;
    profile.gender = faker.helpers.arrayElement(Object.values(Gender));
    return profile;
});
