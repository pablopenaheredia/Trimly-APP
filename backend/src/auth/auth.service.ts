import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dto/login.dto';
import { Usuario } from '../usuarios/usuario.entity';

type SafeUsuario = Omit<Usuario, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET must be set in production');
    }
  }

  async login(loginDto: LoginDto): Promise<{ token: string; user: SafeUsuario }> {
    const identifier = loginDto.username.trim();

    const usuario = await this.usuariosRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.password')
      .where('usuario.username = :identifier', { identifier })
      .orWhere('usuario.email = :identifier', { identifier })
      .getOne();

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    const passwordOk = await bcrypt.compare(loginDto.password, usuario.password);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = await this.jwtService.signAsync({
      sub: usuario.id,
      rol: usuario.rol,
      username: usuario.username,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = usuario;
    return { token, user: safeUser };
  }

  async verifyToken(token: string): Promise<void> {
    try {
      await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
