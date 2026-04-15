import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  OneToMany, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { RequirementVersion } from '../versions/requirement-version.entity';
import { RequirementValidation } from '../validation/requirement-validation.entity';
import { RequirementStatusDef } from './requirement-status-def.entity';
import { RequirementCategoryDef } from './requirement-category-def.entity';
import { RequirementComment } from './requirement-comment.entity';
import { RequirementAttachment } from './requirement-attachment.entity';

export type RequirementType     = 'funcional' | 'no_funcional';
export type RequirementPriority = 'critica' | 'alta' | 'media' | 'baja';
export type RequirementStatus =
  | 'borrador' | 'en_revision' | 'validado' | 'aprobado'
  | 'implementado' | 'cerrado' | 'rechazado' | 'cancelado' | 'requiere_ajuste';

@Entity('requirements')
export class Requirement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 20 })
  codigo: string;

  @Column({ length: 200 })
  titulo: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ default: 'funcional' })
  tipo: RequirementType;

  /** Slug de categoría (sincronizado con `categoryDef` cuando existe). */
  @Column({ type: 'varchar', length: 100, nullable: true })
  categoria: string | null;

  /** Slugs de categorías múltiples (compat: `categoria` conserva la principal). */
  @Column({ type: 'simple-json', nullable: true })
  categorias: string[] | null;

  @ManyToOne(() => RequirementCategoryDef, { nullable: true, eager: true })
  @JoinColumn({ name: 'category_def_id' })
  categoryDef: RequirementCategoryDef | null;

  @Column({ default: 'media' })
  prioridad: RequirementPriority;

  /** Escala 1–5 para priorización (persistida). */
  @Column({ type: 'int', default: 3 })
  impacto: number;

  @Column({ type: 'int', default: 3 })
  urgencia: number;

  @Column({ type: 'int', default: 3 })
  esfuerzo: number;

  @Column({ type: 'int', default: 3 })
  valor: number;

  /** Slug de estado (sincronizado con `statusDef` cuando existe). */
  @Column({ default: 'borrador' })
  estado: RequirementStatus;

  @ManyToOne(() => RequirementStatusDef, { nullable: true, eager: true })
  @JoinColumn({ name: 'status_def_id' })
  statusDef: RequirementStatusDef | null;

  @Column({ name: 'criterios_aceptacion', type: 'text', nullable: true })
  criteriosAceptacion: string;

  @Column({ default: 1 })
  version: number;

  @Column({ default: false })
  deleted: boolean;

  @ManyToOne(() => Project, (p) => p.requirements, { eager: true })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'solicitante_id' })
  solicitante: User;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'responsable_id' })
  responsable: User;

  /** Usuario que dio de alta el requisito; no se modifica tras la creación. */
  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'created_by_user_id' })
  creadoPor: User | null;

  @OneToMany(() => RequirementVersion, (v) => v.requirement, { cascade: true })
  versions: RequirementVersion[];

  @OneToMany(() => RequirementValidation, (v) => v.requirement, { cascade: true })
  validations: RequirementValidation[];

  @OneToMany(() => RequirementComment, (c) => c.requirement)
  comments: RequirementComment[];

  @OneToMany(() => RequirementAttachment, (a) => a.requirement)
  attachments: RequirementAttachment[];

  @CreateDateColumn({ name: 'created_at' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  actualizadoEn: Date;
}
