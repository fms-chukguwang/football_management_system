import { BaseModel } from '../../common/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('team_join_request_token')
export class TeamJoinRequestToken extends BaseModel {
    @Column()
    token: string;

    @Column({
        name: 'creator_id',
    })
    creatorId: number;

    @Column({
        name: 'user_id',
    })
    userId: number;
}
