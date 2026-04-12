import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  /** Listado completo para administración (incluye inactivos). */
  async findAll(): Promise<User[]> {
    return this.repo.find({
      relations: ['role'],
      order: { nombre: 'ASC' },
    });
  }

  /** Listado mínimo para asignaciones (responsables, solicitantes, validadores). */
  async findAllLookup(): Promise<{ id: number; nombre: string }[]> {
    const rows = await this.repo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
      select: ['id', 'nombre'],
    });
    return rows.map((u) => ({ id: u.id, nombre: u.nombre }));
  }

  async findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** Valida que todos los IDs existan y estén activos (menciones @ en comentarios). */
  async ensureActiveUserIdsExist(ids: number[]): Promise<void> {
    const unique = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))];
    if (!unique.length) return;
    const rows = await this.repo.find({
      where: { id: In(unique), activo: true },
      select: ['id'],
    });
    if (rows.length !== unique.length) {
      throw new BadRequestException(
        'Una o más menciones no corresponden a usuarios activos',
      );
    }
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'r')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email: email.trim() },
      relations: ['role'],
    });
  }

  async setPasswordPlain(id: number, plain: string): Promise<void> {
    const hashed = await bcrypt.hash(plain, 12);
    await this.repo.update(id, { password: hashed });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El email ya está registrado');

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = this.repo.create({
      nombre: dto.nombre,
      email: dto.email,
      password: hashed,
      activo: dto.activo ?? true,
      role: { id: dto.roleId } as any,
    });
    return this.repo.save(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.password) {
      dto = { ...dto, password: await bcrypt.hash(dto.password, 12) };
    }
    Object.assign(user, dto);
    if (dto.roleId) user.role = { id: dto.roleId } as any;
    return this.repo.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.activo = false;
    await this.repo.save(user);
  }
}
