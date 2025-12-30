import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { LoginDto } from '../dto/login.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { Usuario } from './usuario.entity';
import { AuthService } from '../auth/auth.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get('check-username/:username')
  async checkUsername(@Param('username') username: string) {
    return this.usuariosService.checkUsername(username);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<Usuario> {
    const usuarioActualizado = await this.usuariosService.update(
      +id,
      updateUsuarioDto,
    );
    if (!usuarioActualizado) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }
    return usuarioActualizado;
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // Mantener compatibilidad: delegar al auth real.
    return this.authService.login(loginDto);
  }
}
