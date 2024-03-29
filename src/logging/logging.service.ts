import { Injectable, LoggerService } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Logging, LoggingDocument } from './entities/logging.entity';
import { Model } from 'mongoose';

@Injectable()
export class LoggingService implements LoggerService {
    constructor(
        @InjectModel(Logging.name)
        private loggingModel: Model<LoggingDocument>,
    ) {}

    async log(message: any) {
        const createLog = await this.loggingModel.create({
            level: Level.log,
            message: message,
        });
    }

    async error(message: any, ...optionalParams: any[]) {
        const createError = await this.loggingModel.create({
            level: Level.error,
            message: message,
        });
    }

    async warn(message: any, ...optionalParams: any[]) {
        const createWarn = await this.loggingModel.create({
            level: Level.warn,
            message: message,
        });
    }

    async debug(message: any, ...optionalParams: any[]) {
        const createDebug = await this.loggingModel.create({
            level: Level.debug,
            message: message,
        });
    }

    async verbose(message: any, ...optionalParams: any[]) {
        const createVerbose = await this.loggingModel.create({
            level: Level.verbose,
            message: message,
        });
    }

    async fatal(message: any, ...optionalParams: any[]) {
        const createFatal = await this.loggingModel.create({
            level: Level.fatal,
            message: message,
        });
    }
}

enum Level {
    log = '[LOG]',
    error = '[ERROR]',
    warn = '[WARN]',
    debug = '[DEBUG]',
    verbose = '[VERBOSE]',
    fatal = '[FATAL]',
}
