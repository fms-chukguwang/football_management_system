import { Member } from 'src/member/entities/member.entity';
import { setSeederFactory } from 'typeorm-extension';

export default setSeederFactory(Member, (faker) => {
    const member = new Member();
    member.isStaff = faker.datatype.boolean();
    member.joinDate = faker.date.past();
    member.createdAt = new Date();
    member.updatedAt = new Date();
    member.deletedAt = null;
    return member;
});
