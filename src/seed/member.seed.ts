import { DataFactory, Seeder } from 'nestjs-seeder';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../Member/entities/Member.entity';

@Injectable()
export class MemberSeed implements Seeder {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  seed(): Promise<any> {
    const member = DataFactory.createForClass(Member).generate(50);

    return this.memberRepository.insert(member);
  }
  drop(): Promise<any> {
    return this.memberRepository.delete({});
  }
}
