import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Requirement } from '../requirements/requirement.entity';
import { User } from '../users/user.entity';

@Entity('requirement_versions')
export class RequirementVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Requirement, (r) => r.versions)
  @JoinColumn({ name: 'requirement_id' })
  requirement: Requirement;

  @Column()
  version: number;

  @Column({ length: 200 })
  titulo: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'text', nullable: true, name: 'criterios_aceptacion' })
  criteriosAceptacion: string;

  @Column({ length: 500, nullable: true, name: 'motivo_cambio' })
  motivoCambio: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'creado_por_id' })
  creadoPor: User;

  @CreateDateColumn({ name: 'created_at' })
  creadoEn: Date;
}
