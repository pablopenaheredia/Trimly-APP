import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'path';
import { ClientesModule } from './clientes/clientes.module';
import { ServiciosModule } from './servicios/servicios.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ProductoModule } from './producto/producto.module';
import { TurnosModule } from './turnos/turnos.module';
import { FacturacionModule } from './facturacion/facturacion.module';
import { ReportesModule } from './reportes/reportes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';

const dbSsl = process.env.DB_SSL === 'true';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: String(process.env.DB_PASSWORD || ''),
      database: process.env.DB_DATABASE || 'postgres',
      entities: [join(__dirname, '**', '*.entity.{ts,js}')],
      synchronize: process.env.NODE_ENV !== 'production',
      ssl: dbSsl ? { rejectUnauthorized: false } : false,
      extra: dbSsl ? { ssl: { rejectUnauthorized: false } } : undefined,
      connectTimeoutMS: 10000,
      logging: ['error', 'warn'],
    }),
    ClientesModule,
    ServiciosModule,
    UsuariosModule,
    ProductoModule,
    TurnosModule,
    FacturacionModule,
    ReportesModule,
    DashboardModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
