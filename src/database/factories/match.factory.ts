import { Match } from 'src/match/entities/match.entity';
import { setSeederFactory } from 'typeorm-extension';

export default setSeederFactory(Match, (faker) => {
    const match = new Match();
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setMonth(today.getMonth() - 2); // 2달 전
    const futureDate = new Date(today);
    futureDate.setMonth(today.getMonth() + 1); // 1달 후

    let randomDate = faker.date.between({ from: pastDate, to: futureDate });

    match.date = randomDate.toISOString().split('T')[0];
    match.time = randomDate.toISOString().split('T')[1].split('.')[0];
    match.soccer_field_id = faker.number.int({ min: 1, max: 100 });
    match.created_at = new Date();
    match.updated_at = new Date();
    match.deleted_at = null;
    return match;
});
