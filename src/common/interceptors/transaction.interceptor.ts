import {
    CallHandler,
    ExecutionContext,
    Injectable,
    InternalServerErrorException,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
    constructor(private readonly dataSource: DataSource) {}
    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest();
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();

        console.log('TransactionInterceptor 1');
        req.qr = qr;
        console.log('TransactionInterceptor 2');

        return next.handle().pipe(
            tap(async () => {
                await qr.commitTransaction();
                await qr.release();
            }),
            catchError(async (error) => {
                await qr.rollbackTransaction();
                await qr.release();

                throw new InternalServerErrorException(error.message);
            }),
        );
    }
}
