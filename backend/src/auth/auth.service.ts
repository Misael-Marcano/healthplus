import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordReset } from './password-reset.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private cfg: ConfigService,
    @InjectRepository(PasswordReset)
    private passwordResetRepo: Repository<PasswordReset>,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');
    if (!user.activo) throw new UnauthorizedException('Usuario inactivo');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas');

    const payload = { sub: user.id, email: user.email };

    const refreshExpires = dto.remember
      ? this.cfg.get('JWT_REFRESH_EXPIRES_IN_REMEMBER', '30d')
      : this.cfg.get('JWT_REFRESH_EXPIRES_IN', '7d');

    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.cfg.get('JWT_SECRET'),
        expiresIn: this.cfg.get('JWT_EXPIRES_IN', '8h'),
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.cfg.get('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpires,
      }),
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.role?.nombre,
        activo: user.activo,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.cfg.get('JWT_REFRESH_SECRET'),
      }) as { sub: number; email: string };

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.activo) throw new UnauthorizedException();

      return {
        accessToken: this.jwtService.sign(
          { sub: user.id, email: user.email },
          {
            secret: this.cfg.get('JWT_SECRET'),
            expiresIn: this.cfg.get('JWT_EXPIRES_IN', '8h'),
          },
        ),
      };
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  private readonly genericForgotMessage =
    'Si el correo existe en el sistema, recibirás instrucciones para restablecer la contraseña.';

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim();
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.activo) {
      return { message: this.genericForgotMessage };
    }

    await this.passwordResetRepo.delete({ email: user.email });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.passwordResetRepo.save(
      this.passwordResetRepo.create({ email: user.email, token, expiresAt }),
    );

    const base =
      this.cfg.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const resetUrl = `${base.replace(/\/$/, '')}/restablecer-contrasena?token=${token}`;

    const out: {
      message: string;
      resetUrl?: string;
      debugToken?: string;
    } = { message: this.genericForgotMessage };

    if (this.cfg.get('NODE_ENV') === 'development') {
      out.resetUrl = resetUrl;
      out.debugToken = token;
    }

    return out;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const row = await this.passwordResetRepo.findOne({
      where: { token: dto.token, expiresAt: MoreThan(new Date()) },
    });
    if (!row) {
      throw new BadRequestException(
        'El enlace no es válido o ha expirado. Solicita uno nuevo.',
      );
    }

    const user = await this.usersService.findByEmail(row.email);
    if (!user || !user.activo) {
      await this.passwordResetRepo.delete({ id: row.id });
      throw new BadRequestException('No se pudo restablecer la contraseña.');
    }

    await this.usersService.setPasswordPlain(user.id, dto.newPassword);
    await this.passwordResetRepo.delete({ id: row.id });

    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
  }
}
