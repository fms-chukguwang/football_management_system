import { utilities, WinstonModule } from 'nest-winston';
import * as winstonDaily from 'winston-daily-rotate-file';
import * as winston from 'winston';

const env = process.env.NODE_ENV;
const logDir = __dirname + '/../../logs'; // log 파일을 관리할 폴더

const config = {
  levels: {
    error: 0,
    debug: 1,
    warn: 2,
    info: 3,
    data: 4,
    verbose: 5,
    silly: 6,
    custom: 7,
  },
  colors: {
    error: 'red',
    debug: 'blue',
    warn: 'yellow',
    info: 'green',
    data: 'magenta',
    verbose: 'cyan',
    silly: 'grey',
    custom: 'yellow',
  },
};

winston.addColors(config.colors);

const dailyOptions = (level) => {
  return {
    dirname: logDir + `/${level}`,
    filename: `%DATE%.${level}.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    json: false,
    level,
  };
};

export const winstonLogger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      level: env === 'production' ? 'http' : 'silly',
      // production 환경이라면 http, 개발환경이라면 모든 단계를 로그
      format:
        env === 'production'
          ? // production 환경은 자원을 아끼기 위해 simple 포맷 사용
            winston.format.simple()
          : winston.format.combine(
              winston.format.colorize({
                all: true, // 모든 색상에 적용
              }),
              winston.format.timestamp(),
              utilities.format.nestLike('FMS', {
                prettyPrint: true, // nest에서 제공하는 옵션. 로그 가독성을 높여줌
              }),
            ),
    }),

    // info, warn, error 로그는 파일로 관리
    new winstonDaily(dailyOptions('custom')),
    new winstonDaily(dailyOptions('debug')),
    new winstonDaily(dailyOptions('info')),
    new winstonDaily(dailyOptions('warn')),
    new winstonDaily(dailyOptions('error')),
  ],
});
