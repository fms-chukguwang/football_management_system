import { User } from 'src/user/entities/user.entity';
import { setSeederFactory } from 'typeorm-extension';
import { UserRole } from 'src/enums/user-role.enum';

export default setSeederFactory(User, (faker) => {
    const user = new User();
    user.email = faker.internet.email();
    user.password = '$2b$10$g8PUcqff9Ybd2N7tuwye4OMoVpLAv9Lz3pCEEplcG.2eK6We3fKbO';
    user.name = faker.person.fullName();
    user.role = UserRole.User;
    user.createdAt = new Date();
    user.updatedAt = new Date();
    user.deletedAt = null;

    return user;
});
