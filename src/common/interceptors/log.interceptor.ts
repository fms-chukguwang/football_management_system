// 로그 인터셉터
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map, observable, tap } from 'rxjs';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    // return next.handle() 전까지 코드는 우리가 사용하려는 함수의 로직이 적용되기 전에 요청이 들어오자마자 실행이 되는 부분
    /**
     * 요청이 들어올 때 REQ 요청이 들어온 타임스탬프를 찍는다.
     * [REQ] {요청 path} {요청 시간}
     *
     * 요청이 끝날 때 (응답이 나갈때) 다시 타임스탬프를 찍는다.
     * [RES {요청 path} {응답 시간} {얼마나 걸렸는지 ms}
     */
    const now = new Date(); // 현재 시간과 날짜
    const req = context.switchToHttp().getRequest();
    const path = req.originalUrl;

    console.log(`[REQ] ${path} ${now.toLocaleString('kr')}`);

    return next
      .handle()
      .pipe(
        tap((observable) =>
          console.log(
            `[RES] ${path} ${new Date().toLocaleString('kr')} ${
              new Date().getMilliseconds() - now.getMilliseconds()
            }ms`,
          ),
        ),
      );
  }
}
