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

  // Habilitar CORS
  // MUY IMPORTANTE: Cambia 'http://localhost:5173' por el puerto exacto de tu frontend React
  app.enableCors({
    origin: 'http://localhost:5173', // <--- VERIFICA ESTE PUERTO. Puede ser 3000, 5173, etc.
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Asegúrate de que PATCH esté aquí
    credentials: true,
  });

  await app.listen(3000); // Tu puerto del backend (normalmente 3000)
}
bootstrap();
