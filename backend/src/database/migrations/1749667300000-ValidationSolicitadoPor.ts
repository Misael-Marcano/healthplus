import { MigrationInterface, QueryRunner } from 'typeorm';

export class ValidationSolicitadoPor1749667300000 implements MigrationInterface {
  name = 'ValidationSolicitadoPor1749667300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE requirement_validations ADD solicitado_por_id int NULL;
      ALTER TABLE requirement_validations ADD CONSTRAINT FK_requirement_validations_solicitado
        FOREIGN KEY (solicitado_por_id) REFERENCES users(id) ON DELETE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE requirement_validations DROP CONSTRAINT FK_requirement_validations_solicitado;
      ALTER TABLE requirement_validations DROP COLUMN solicitado_por_id;
    `);
  }
}
