import { WinstonModule, utilities } from 'nest-winston';
import * as winston from 'winston';
import * as moment from 'moment-timezone';
import * as winstonDaily from 'winston-daily-rotate-file';

const appendTimestamp = winston.format((info, opts) => {
    if (opts.tz) {
        info.timestamp = moment().tz(opts.tz).format();
    }
    return info;
});

const dailyOptions = {
    level: 'http',
    datePattern: 'YYYY-MM-DD',
    dirname: __dirname + '../../logs',
    filename: `fms.log.%DATE%`,
    maxFiles: '14d',
    zippedArchive: true,
    colorize: true,
    handleExceptions: true,
    json: false,
};

export const winstonLogger = WinstonModule.createLogger({
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                utilities.format.nestLike('FMS Backend', {
                    prettyPrint: true,
                }),
            ),
        }),
        new winstonDaily(dailyOptions),
    ],

    // 포맷 설정

    format: winston.format.combine(
        appendTimestamp({ tz: 'Asia/Seoul' }),
        winston.format.json(),
        winston.format.printf((info) => `${info.timestamp} [${info.level}] ${info.message}`),
    ),
});
