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

@Entity('requirement_comments')
export class RequirementComment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Requirement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requirement_id' })
  requirement: Requirement;

  @ManyToOne(() => User, { eager: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'user_id' })
  autor: User;

  @Column({ type: 'text' })
  texto: string;

  /** IDs de usuarios mencionados con @ (notificaciones / filtrado). */
  @Column({ type: 'simple-json', nullable: true, name: 'menciones' })
  menciones: number[] | null;

  @CreateDateColumn({ name: 'created_at' })
  creadoEn: Date;
}
