// ...existing code...
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita el ValidationPipe globalmente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS con validación mejorada usando FRONTEND_URL
  const frontendUrl = process.env.FRONTEND_URL;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origin === frontendUrl || origin === frontendUrl + '/') {
        callback(null, true);
      } else {
        callback(new Error('CORS blocked'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
// ...existing code...