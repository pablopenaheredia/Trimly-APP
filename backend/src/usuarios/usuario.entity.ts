import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Turno } from '../turnos/turno.entity'; // Ajusta la ruta si es necesario

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  password: string;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'empleado'],
    default: 'empleado',
  })
  rol: 'admin' | 'empleado';

  @Column({ default: true })
  activo: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaCreacion: Date;

  // 🔹 Relación inversa con Turno
  @OneToMany(() => Turno, turno => turno.usuario)
  turnos?: Turno[]; // Opcional
}
