import { IsNumber, IsDateString, IsOptional, IsString, IsEnum } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateTurnoDto } from './create-turno.dto';

export class UpdateTurnoDto extends PartialType(CreateTurnoDto) {
  @IsOptional()
  @IsEnum(['pendiente', 'cobrado', 'cancelado'])
  estado?: 'pendiente' | 'cobrado' | 'cancelado';
}
