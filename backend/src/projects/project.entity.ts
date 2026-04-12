import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  OneToMany, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Requirement } from '../requirements/requirement.entity';

export type ProjectStatus = 'activo' | 'pausado' | 'completado' | 'cancelado';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: 'activo' })
  estado: ProjectStatus;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'responsable_id' })
  responsable: User;

  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin: Date;

  @Column({ default: false, name: 'deleted' })
  deleted: boolean;

  @OneToMany(() => Requirement, (r) => r.project)
  requirements: Requirement[];

  @CreateDateColumn({ name: 'created_at' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  actualizadoEn: Date;
}
