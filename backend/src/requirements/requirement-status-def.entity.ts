import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Project } from '../projects/project.entity';

/**
 * Catálogo de estados configurables (globales o por proyecto).
 * `slug` es estable para integraciones; `nombre` es lo que ve el usuario.
 */
@Entity('requirement_status_defs')
@Unique('UQ_req_status_slug_scope', ['slug', 'project'])
export class RequirementStatusDef {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  nombre: string;

  /** Identificador único en el ámbito (global o proyecto), ej. en_proceso */
  @Column({ length: 64 })
  slug: string;

  @ManyToOne(() => Project, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project | null;

  @Column({ type: 'int', default: 0 })
  orden: number;

  /** Explícito para MSSQL: `string | null` sin `type` se refleja como Object y falla al arrancar. */
  @Column({ type: 'varchar', length: 16, nullable: true })
  color: string | null;

  @Column({ default: true })
  activo: boolean;

  /** Si true, no se elimina (solo desactivar); viene del seed del sistema. */
  @Column({ default: false, name: 'es_sistema' })
  esSistema: boolean;

  @CreateDateColumn({ name: 'created_at' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  actualizadoEn: Date;
}
