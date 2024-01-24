// 로그 인터셉터
import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, map, observable, tap } from 'rxjs';
import { LoggerMiddleware } from '../middleware/logger.middleware';
import { LoggingService } from 'src/logging/logging.service';

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
        // if (
        //     method === 'GET' ||
        //     method === 'POST' ||
        //     method === 'PUT' ||
        //     method === 'DELETE' ||
        //     method === 'PATCH'
        // ) {
        //     this.myLogger.log(
        //         `[REQ] ${method} ${path} ${now.toLocaleString('ko-KR', {
        //             timeZone: 'Asia/Seoul',
        //         })}`,
        //     );
        // }
        return next.handle().pipe(
            tap((observable) => {
                console.log(
                    `[RES] ${method} ${path} ${new Date().toLocaleString('ko-KR', {
                        timeZone: 'Asia/Seoul',
                    })} ${new Date().getMilliseconds() - now.getMilliseconds()}ms
                    [RETURN] ${JSON.stringify(observable)}`,
                );
                if (
                    method === 'GET' ||
                    method === 'POST' ||
                    method === 'PUT' ||
                    method === 'DELETE' ||
                    method === 'PATCH'
                ) {
                    if (path !== '/api/users/me') {
                        this.myLogger.log(
                            `
                            [REQ] ${method} ${path} ${now.toLocaleString('ko-KR', {
                                timeZone: 'Asia/Seoul',
                            })}
                            [RES] ${method} ${path} ${new Date().toLocaleString('ko-KR', {
                                timeZone: 'Asia/Seoul',
                            })} ${new Date().getMilliseconds() - now.getMilliseconds()}ms
                            [RETURN] ${JSON.stringify(observable)}`,
                        );
                    }
                }
            }),
        );
    }
}
