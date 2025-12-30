import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Usuario } from '../usuarios/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev_insecure_secret_change_me',
      signOptions: {
        // jsonwebtoken v9 tipa expiresIn como un string "ms-like" (StringValue) o number;
        // process.env es string genérico, así que casteamos para evitar fricción de tipos.
        expiresIn: (process.env.JWT_EXPIRES_IN || '12h') as any,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
