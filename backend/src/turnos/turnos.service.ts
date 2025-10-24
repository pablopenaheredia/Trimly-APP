import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turno } from './turno.entity';
import { CreateTurnoDto } from '../dto/create-turno.dto';
import { Cliente } from '../clientes/cliente.entity';
import { Servicio } from '../servicios/servicio.entity';
import { UpdateTurnoDto } from '../dto/update-turno.dto';
import { Usuario } from '../usuarios/usuario.entity'; // Importa la entidad Usuario

@Injectable()
export class TurnosService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,

    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,

    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>, // Inyecta el repositorio de Usuario
  ) {}

  async create(createTurnoDto: CreateTurnoDto): Promise<Turno> {
    const cliente = await this.clienteRepository.findOneBy({
      id: createTurnoDto.clienteId,
    });
    const servicio = await this.servicioRepository.findOneBy({
      id: createTurnoDto.servicioId,
    });

    if (!cliente || !servicio) {
      throw new NotFoundException('Cliente o servicio no encontrado');
    }

    // Usuario ahora es opcional
    let usuario: Usuario | null = null; // <-- Cambio aquí
    if (createTurnoDto.usuarioId) {
      usuario = await this.usuarioRepository.findOneBy({ id: createTurnoDto.usuarioId });
      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }
    }

    const turno = this.turnoRepository.create({
      cliente,
      servicio,
      usuario, // puede ser null
      fecha: createTurnoDto.fecha,
      hora: createTurnoDto.hora,
      notas: createTurnoDto.notas, // Change this from notasAdicionales to notas
    });

    return await this.turnoRepository.save(turno);
  }

  async findAll(): Promise<Turno[]> {
    return await this.turnoRepository.find({
      relations: ['cliente', 'servicio', 'usuario','factura'], // Incluye usuario en las relaciones
    });
  }

  async findOne(id: number): Promise<Turno> {
    const turno = await this.turnoRepository.findOne({
      where: { id },
      relations: ['cliente', 'servicio', 'usuario','factura'], // Incluye usuario en las relaciones
    });
    if (!turno) {
      throw new NotFoundException(`Turno con id ${id} no encontrado`);
    }
    return turno;
  }

  async update(id: number, updateTurnoDto: UpdateTurnoDto): Promise<Turno> {
    // Check if turno exists
    const turno = await this.turnoRepository.findOne({ where: { id } });
    if (!turno) {
      throw new NotFoundException(`Turno with id ${id} not found`);
    }

    // Create a data object to hold the updated values
    const updatedData: any = {};

    // Handle cliente relationship if clienteId is provided
    if (updateTurnoDto.clienteId) {
      const cliente = await this.clienteRepository.findOne({
        where: { id: updateTurnoDto.clienteId },
      });
      if (!cliente) {
        throw new NotFoundException(
          `Cliente with id ${updateTurnoDto.clienteId} not found`,
        );
      }
      updatedData.cliente = cliente;
    }

    // Handle servicio relationship if servicioId is provided
    if (updateTurnoDto.servicioId) {
      const servicio = await this.servicioRepository.findOne({
        where: { id: updateTurnoDto.servicioId },
      });
      if (!servicio) {
        throw new NotFoundException(
          `Servicio with id ${updateTurnoDto.servicioId} not found`,
        );
      }
      updatedData.servicio = servicio;
    }

    // Maneja la relación con usuario si usuarioId es provisto
    if (updateTurnoDto.usuarioId !== undefined) {
      if (updateTurnoDto.usuarioId === null) {
        updatedData.usuario = null; // quitar usuario del turno
      } else {
        const usuario = await this.usuarioRepository.findOneBy({ id: updateTurnoDto.usuarioId });
        if (!usuario) {
          throw new NotFoundException(
            `Usuario with id ${updateTurnoDto.usuarioId} not found`,
          );
        }
        updatedData.usuario = usuario;
      }
    }

    // Handle direct fields
    if (updateTurnoDto.fecha) {
      updatedData.fecha = updateTurnoDto.fecha;
    }

    if (updateTurnoDto.hora) {
      updatedData.hora = updateTurnoDto.hora;
    }

    // Map notas correctly
    if (updateTurnoDto.notas !== undefined) {
      updatedData.notas = updateTurnoDto.notas; // Change this from notasAdicionales to notas
    }

    // Handle estado field
    if (updateTurnoDto.estado) {
      updatedData.estado = updateTurnoDto.estado;
    }

    // Update the entity
    await this.turnoRepository.update(id, updatedData);

    // Return the updated turno with its relations
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.turnoRepository.delete(id);
  }
}
