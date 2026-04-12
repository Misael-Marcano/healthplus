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
 * Catálogo de categorías configurables (globales o por proyecto).
 * Misma idea que `RequirementStatusDef`.
 */
@Entity('requirement_category_defs')
@Unique('UQ_req_cat_slug_scope', ['slug', 'project'])
export class RequirementCategoryDef {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  nombre: string;

  @Column({ length: 64 })
  slug: string;

  @ManyToOne(() => Project, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project | null;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ type: 'varchar', length: 16, nullable: true })
  color: string | null;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: false, name: 'es_sistema' })
  esSistema: boolean;

  @CreateDateColumn({ name: 'created_at' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  actualizadoEn: Date;
}
