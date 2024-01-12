import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('email_verification')
export class EmailVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  code: string;

  @Column({default:1})
  attempts: number;
  
  @Column({ type: 'timestamp'}) 
  expiry: Date;
  
  
}
