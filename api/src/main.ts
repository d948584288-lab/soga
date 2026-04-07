import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const corsReflect =
    process.env.CORS_REFLECT === '1' ||
    process.env.CORS_REFLECT === 'true';

  if (corsReflect) {
    app.enableCors({ origin: true, credentials: true });
  } else {
    const corsRaw = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
    let corsOrigins = corsRaw.split(',').map((o) => o.trim()).filter(Boolean);
    if (corsOrigins.length === 0) {
      corsOrigins = ['http://localhost:3000'];
    }
    const allowAny = corsOrigins.length === 1 && corsOrigins[0] === '*';
    app.enableCors({
      origin: allowAny ? true : corsOrigins,
      credentials: !allowAny,
    });
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Platform API')
    .setDescription('Enterprise API — auth and domain routes will be extended here.')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
  });

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
