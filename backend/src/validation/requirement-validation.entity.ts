import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Requirement } from '../requirements/requirement.entity';
import { User } from '../users/user.entity';

export type ValidationStatus = 'pendiente' | 'aprobado' | 'rechazado' | 'comentado';

@Entity('requirement_validations')
export class RequirementValidation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Requirement, (r) => r.validations)
  @JoinColumn({ name: 'requirement_id' })
  requirement: Requirement;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'validador_id' })
  validador: User;

  /** Usuario que solicitó la validación (analista / admin). */
  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'solicitado_por_id' })
  solicitadoPor: User | null;

  @Column({ default: 'pendiente' })
  estado: ValidationStatus;

  @Column({ type: 'text', nullable: true })
  comentario: string;

  @CreateDateColumn({ name: 'created_at' })
  creadoEn: Date;
}
