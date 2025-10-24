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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'TRIMLY2025',
      database: 'pruebas',
      entities: [join(__dirname, '**', '*.entity.{ts,js}')],
      synchronize: true,
    }),
    ClientesModule,
    ServiciosModule,
    UsuariosModule,
    ProductoModule,
    TurnosModule,
    FacturacionModule,
    ReportesModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
