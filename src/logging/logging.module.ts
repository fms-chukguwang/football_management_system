import { Module } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LoggingController } from './logging.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Logging, LoggingSchema } from './entities/logging.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Logging.name, schema: LoggingSchema }]),
  ],
  providers: [LoggingService],
  controllers: [LoggingController],
  exports: [LoggingService],
})
export class LoggingModule {}
