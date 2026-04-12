import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import type { RolePermisos } from './role-permissions';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  nombre: string;

  @Column({ length: 200, nullable: true })
  descripcion: string;

  /** Matriz de permisos (UI + cliente); el servidor sigue usando @Roles en controladores. */
  @Column({ type: 'simple-json', nullable: true, name: 'permisos' })
  permisos: RolePermisos | null;

  @OneToMany(() => User, (u) => u.role)
  users: User[];
}
