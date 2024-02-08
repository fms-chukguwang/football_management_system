import { Inject, Injectable, Logger, LoggerService, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggingService } from '../../logging/logging.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger(LoggerMiddleware.name);
    constructor(private readonly myLogger: LoggingService) {}
    use(req: Request, res: Response, next: NextFunction) {
        // 요청 객체로부터 ip, http method, url, user agent를 받아온 후
        const { ip, method, originalUrl } = req;
        const userAgent = req.get('user-agent');

        res.on('finish', () => {
            const { statusCode } = res;
            this.logger.log(`${method} ${originalUrl} ${statusCode} ${ip} ${userAgent}`);
        });

        next();
    }
}
