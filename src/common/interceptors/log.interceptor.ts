// 로그 인터셉터
import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, map, observable, tap } from 'rxjs';
import { LoggerMiddleware } from '../middleware/logger.middleware';
import { LoggingService } from '../../logging/logging.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class LogInterceptor implements NestInterceptor {
    constructor(private readonly myLogger: LoggingService) {}
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        const now = new Date(); // 현재 시간과 날짜
        const req = context.switchToHttp().getRequest();
        const path = req.originalUrl;
        const method = req.method;
        console.log(
            `[REQ] ${method} ${path} ${now.toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
            })}`,
        );

        return next.handle().pipe(
            tap((observable) => {
                console.log(
                    `[RES] ${method} ${path} ${new Date().toLocaleString('ko-KR', {
                        timeZone: 'Asia/Seoul',
                    })} ${new Date().getMilliseconds() - now.getMilliseconds()}ms`,
                );
                let loggingForm = `[REQ] ${method} ${path} ${now.toLocaleString('ko-KR', {
                    timeZone: 'Asia/Seoul',
                })} ,
[REQ]: Body ${JSON.stringify(req.body)}
[RES] ${method} ${path} ${new Date().toLocaleString('ko-KR', {
                    timeZone: 'Asia/Seoul',
                })} ${new Date().getMilliseconds() - now.getMilliseconds()}ms,
status: ${observable?.statusCode || 200}
message: ${observable?.message || 'OK'}
return data: ${JSON.stringify(observable?.data)}`;

                if (
                    method === 'GET' ||
                    method === 'POST' ||
                    method === 'PUT' ||
                    method === 'DELETE' ||
                    method === 'PATCH'
                ) {
                    if (path.split('/')[2] === 'admin') {
                        this.myLogger.warn(loggingForm);
                    } else {
                        this.myLogger.log(loggingForm);
                    }
                }
            }),
        );
    }
}
