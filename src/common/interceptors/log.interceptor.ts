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
        const now = new Date();
        const req = context.switchToHttp().getRequest();
        const url = req.originalUrl;
        const method = req.method;
        const headers = req.headers ? req.headers : {};
        const body = req.body ? req.body : {};
        const query = req.query ? req.query : {};

        console.log(
            `[REQ] ${method} ${url} ${JSON.stringify(headers)} ${JSON.stringify(query)} ${JSON.stringify(body)} ${now.toLocaleString(
                'ko-KR',
                {
                    timeZone: 'Asia/Seoul',
                },
            )}`,
        );

        return next.handle().pipe(
            tap((observable) => {
                console.log(
                    `[RES] ${method} ${url} ${new Date().toLocaleString('ko-KR', {
                        timeZone: 'Asia/Seoul',
                    })} ${new Date().getMilliseconds() - now.getMilliseconds()}ms`,
                );

                let loggingForm = `[REQ] ${method} ${url} ${now.toLocaleString('ko-KR', {
                    timeZone: 'Asia/Seoul',
                })} ,
[REQ]: Body ${JSON.stringify(body)}
[RES] ${method} ${url} ${new Date().toLocaleString('ko-KR', {
                    timeZone: 'Asia/Seoul',
                })} ${new Date().getMilliseconds() - now.getMilliseconds()}ms,
status: ${observable?.statusCode || 200}
message: ${observable?.message || 'OK'}
return data: ${url.split('/')[2] === 'chats' ? '채팅 데이터 반환' : JSON.stringify(observable?.data)}`;

                if (
                    method === 'GET' ||
                    method === 'POST' ||
                    method === 'PUT' ||
                    method === 'DELETE' ||
                    method === 'PATCH'
                ) {
                    if (url.split('/')[2] === 'admin') {
                        this.myLogger.warn(loggingForm);
                    } else {
                        this.myLogger.log(loggingForm);
                    }
                }
            }),
        );
    }
}
