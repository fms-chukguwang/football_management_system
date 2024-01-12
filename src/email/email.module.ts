import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { EmailVerification } from '../email/entities/email.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailVerification]), 
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}