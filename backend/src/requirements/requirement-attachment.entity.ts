import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Requirement } from './requirement.entity';
import { User } from '../users/user.entity';

@Entity('requirement_attachments')
export class RequirementAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Requirement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requirement_id' })
  requirement: Requirement;

  @Column({ name: 'nombre_original', length: 255 })
  nombreOriginal: string;

  /** Ruta relativa al directorio de uploads (p. ej. requirements/12/archivo.pdf). */
  @Column({ name: 'ruta_almacenamiento', length: 500 })
  rutaAlmacenamiento: string;

  @Column({ name: 'mime_type', length: 120 })
  mimeType: string;

  @Column({ name: 'tamano_bytes', type: 'int' })
  tamanoBytes: number;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'subido_por_id' })
  subidoPor: User | null;

  @CreateDateColumn({ name: 'created_at' })
  creadoEn: Date;
}
