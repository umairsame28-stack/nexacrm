import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { createLogger, format, transports } from 'winston';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser: () => import('express').RequestHandler = require('cookie-parser');
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { validateProductionSecrets } from './config/secret-validation';

async function bootstrap(): Promise<void> {
  // Validate production secrets before app initialization
  validateProductionSecrets(process.env as Record<string, string | undefined>);

  const logger = createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    format:
      process.env.NODE_ENV === 'production'
        ? format.combine(format.timestamp(), format.json())
        : format.combine(format.colorize(), format.timestamp(), format.simple()),
    transports: [new transports.Console()],
  });

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: logger }),
    bufferLogs: true,
    rawBody: true,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3001);
  const corsOrigins = config.get<string>('app.corsOrigins', 'http://localhost:3000');
  const apiPrefix = config.get<string>('app.apiPrefix', 'api/v1');

  // Middleware
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Workspace-ID', 'X-Request-ID'],
  });

  // API prefix
  app.setGlobalPrefix(apiPrefix);

  // Global pipes, filters, interceptors
  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(),
    new ResponseTransformInterceptor(),
  );

  // Swagger documentation
  if (config.get<string>('app.nodeEnv') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NexaCRM API')
      .setDescription('AI-Powered WhatsApp CRM SaaS — REST API Documentation')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .addApiKey(
        { type: 'apiKey', in: 'header', name: 'X-Workspace-ID' },
        'WorkspaceID',
      )
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // Health check endpoint (outside api prefix)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: unknown, res: { json: (data: unknown) => void }) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);
  logger.info(`NexaCRM API listening on port ${port} [${config.get('app.nodeEnv')}]`);
  logger.info(`Swagger docs: http://localhost:${port}/docs`);
}

void bootstrap();
