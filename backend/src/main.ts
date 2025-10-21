// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // <-- Importa ValidationPipe

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita el ValidationPipe globalmente para que los DTOs funcionen
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Esto eliminará propiedades que no estén en tus DTOs (buena práctica)
      forbidNonWhitelisted: true, // Esto lanzará un error si el frontend envía propiedades que no están en el DTO
      transform: true, // Esto transforma el payload de la request a una instancia de tu clase DTO
    }),
  );

  // Habilitar CORS dinámicamente usando FRONTEND_URL (se configura en Vercel)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Asegúrate de que PATCH esté aquí
    credentials: true,
  });

  await app.listen(3000); // Tu puerto del backend (normalmente 3000)
}
bootstrap();
