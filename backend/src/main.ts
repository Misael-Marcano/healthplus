import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix global
  app.setGlobalPrefix('api');

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS: en desarrollo acepta cualquier origen (localhost con distintos puertos, p. ej. Next 3000 vs Docker 3002).
  // En producción usa solo FRONTEND_URL.
  const isProd = process.env.NODE_ENV === 'production';
  app.enableCors({
    origin: isProd
      ? (process.env.FRONTEND_URL ?? 'http://localhost:3000')
      : true,
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('HealthPlus API')
    .setDescription('Sistema de Gestión de Requisitos — HealthPlus Clínica Integral')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 API corriendo en: http://localhost:${port}/api`);
  console.log(`📚 Swagger en:       http://localhost:${port}/api/docs`);
}
bootstrap();
