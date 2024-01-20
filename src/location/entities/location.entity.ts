import { IsNumber, IsString } from 'class-validator';
import { BaseModel } from '../../common/entities/base.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TeamModel } from '../../team/entities/team.entity';
import { Factory } from 'nestjs-seeder';
import { Profile } from 'src/profile/entities/profile.entity';

@Entity('location')
export class LocationModel extends BaseModel {
    @PrimaryGeneratedColumn()
    id: number;
    
    /**
     * 우편 번호
     * @example 16661
     */
    // @Column({
    //     unique: true,
    //     name: 'postal_code',
    // })
    // @IsNumber()
    // postalCode: number;

    /**
     * 지역
     * @example "경기"
     */
    @Factory((faker) => faker.location.state())
    @Column()
    state: string;

    /**
     * 도시
     * @example "수원시"
     */
     @Factory((faker) => faker.location.city())
    @Column()
    city: string;

    /**
     * 구
     * @example "권선구"
     */
    @Column()
    @Factory((faker) => faker.location.county())
    district: string;

    /**
     * 주소
     * @example "경기 수원시 권선구"
     */
    @Column()
    @Factory((faker) => faker.location.street())
    address: string;

    @OneToMany(() => TeamModel, (team) => team.location)
    team: TeamModel[];

    @OneToOne(() => Profile, (profile) => profile.location)
    @JoinColumn()
    profile: Profile;
}
