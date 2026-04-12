import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('notification_reads')
@Unique('UQ_notification_reads_user_kind_ref', ['userId', 'kind', 'refId'])
@Index('IX_notification_reads_user_id', ['userId'])
export class NotificationRead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** Coincide con `InboxItemKind` en el servicio de notificaciones. */
  @Column({ length: 32 })
  kind: string;

  @Column({ name: 'ref_id' })
  refId: number;

  @CreateDateColumn({ name: 'read_at' })
  readAt: Date;
}
