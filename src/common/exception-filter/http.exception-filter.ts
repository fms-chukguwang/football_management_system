import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { LoggingService } from 'src/logging/logging.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(private readonly myLogger: LoggingService) {}
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        const status = exception.getStatus();

        const err = exception.getResponse() as
            | { message: any; statusCode: number; error: number }
            | { error: number; statusCode: 400; message: string[] }; // class-validator 타이핑
        this.myLogger.error(`[ERR] ${req.method} ${req.url} ${new Date().toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
        })},
Status: ${status}
Message: ${err.message}                    
Exception: ${err.error}
Stack: ${exception.stack}
`);

        res.status(status).json({
            statusCode: status,
            message: err.message,
            timestamp: new Date().toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
            }),
            path: req.url,
        });
    }
}
