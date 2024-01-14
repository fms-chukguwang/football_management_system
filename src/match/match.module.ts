import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Match } from './entities/match.entity';
import { EmailService } from 'src/email/email.service';
import { EmailVerification } from 'src/email/entities/email.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Match,EmailVerification]),AuthModule],
  controllers: [MatchController],
  providers: [MatchService,EmailService]
})
export class MatchModule {}
