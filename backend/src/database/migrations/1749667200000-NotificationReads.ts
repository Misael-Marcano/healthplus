import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lecturas de notificaciones por usuario (validación / comentario / adjunto).
 */
export class NotificationReads1749667200000 implements MigrationInterface {
  name = 'NotificationReads1749667200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE notification_reads (
        id int NOT NULL IDENTITY(1,1),
        user_id int NOT NULL,
        kind nvarchar(32) NOT NULL,
        ref_id int NOT NULL,
        read_at datetime2 NOT NULL CONSTRAINT DF_notification_reads_read_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_notification_reads PRIMARY KEY (id),
        CONSTRAINT FK_notification_reads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT UQ_notification_reads_user_kind_ref UNIQUE (user_id, kind, ref_id)
      );
      CREATE INDEX IX_notification_reads_user_id ON notification_reads (user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE notification_reads;`);
  }
}
