import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { HttpExceptionFilter } from './common/exception-filter/http.exception-filter';
import { winstonLogger } from './configs/winston.config';
import { LoggingService } from './logging/logging.service';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

async function bootstrap() {
    const app = await NestFactory.create(
        AppModule,
        //   {
        //   logger: winstonLogger,
        // }
    );

    const appInstance = app.getHttpAdapter().getInstance();
    // .env 파일을 현재 환경에 로드
    dotenv.config();

    // Sentry.init({
    //     dsn: 'https://b339c761a776126b9106d85dc91adad0@o4506635578441728.ingest.sentry.io/4506661613010944',
    //     integrations: [
    //         // enable HTTP calls tracing
    //         new Sentry.Integrations.Http({ tracing: true }),
    //         // enable Express.js middleware tracing
    //         new Sentry.Integrations.Express({ app: appInstance }),
    //         new ProfilingIntegration(),
    //     ],
    //     // Performance Monitoring
    //     tracesSampleRate: 1.0, //  Capture 100% of the transactions
    //     // Set sampling rate for profiling - this is relative to tracesSampleRate
    //     profilesSampleRate: 1.0,
    // });

    // // The request handler must be the first middleware on the app
    // app.use(Sentry.Handlers.requestHandler());

    // // TracingHandler creates a trace for every incoming request
    // app.use(Sentry.Handlers.tracingHandler());

    // // The error handler must be registered before any other error middleware and after all controllers
    // app.use(Sentry.Handlers.errorHandler());

    const configService = app.get(ConfigService);
    const port = configService.get<number>('SERVER_PORT');

    //const FRONT_PORT = configService.get<number>('FRONT_PORT');
    const corsOptions = {
        origin: `${process.env.FRONT_HOST}:${
            process.env.FRONT_PORT || 3001
          }`,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
        allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
    };

    app.enableCors(corsOptions);

    app.setGlobalPrefix('api', { exclude: ['/health-check'] });

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            transformOptions: {
                enableImplicitConversion: true, // DTO에 ClassValidator로 정의된 타입으로 자동 변환
            },
        }),
    );

    // 에러메세지 형식 통일
    const logger = app.get(LoggingService);
    app.useGlobalFilters(new HttpExceptionFilter(logger));

    const config = new DocumentBuilder()
        .setTitle('Sparta Node.js TS')
        .setDescription('Document for Sparta Node.js TS')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }) // JWT 사용을 위한 설정
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
            persistAuthorization: true, // 새로고침 시에도 JWT 유지하기
            tagsSorter: 'alpha', // API 그룹 정렬을 알파벳 순으로
            operationsSorter: 'alpha', // API 그룹 내 정렬을 알파벳 순으로
        },
    });

    await app.listen(port);
}
bootstrap();
