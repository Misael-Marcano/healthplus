import { MigrationInterface, QueryRunner } from 'typeorm';

export class RequirementCreatedBy1750120000000 implements MigrationInterface {
  name = 'RequirementCreatedBy1750120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE requirements ADD created_by_user_id int NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE requirements ADD CONSTRAINT FK_requirements_created_by_user
      FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE requirements DROP CONSTRAINT FK_requirements_created_by_user`,
    );
    await queryRunner.query(
      `ALTER TABLE requirements DROP COLUMN created_by_user_id`,
    );
  }
}
