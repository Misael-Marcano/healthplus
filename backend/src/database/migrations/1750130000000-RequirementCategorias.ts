import { MigrationInterface, QueryRunner } from 'typeorm';

export class RequirementCategorias1750130000000 implements MigrationInterface {
  name = 'RequirementCategorias1750130000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE requirements ADD categorias nvarchar(max) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE requirements DROP COLUMN categorias`);
  }
}

