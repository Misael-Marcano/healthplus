import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  accion: string;

  @Column({ length: 100, nullable: true, name: 'entidad' })
  entidad: string;

  @Column({ name: 'entidad_id', nullable: true })
  entidadId: number;

  @Column({ type: 'text', nullable: true })
  detalle: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 45, nullable: true, name: 'ip_address' })
  ipAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  creadoEn: Date;
}
