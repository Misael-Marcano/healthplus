import { MigrationInterface, QueryRunner } from 'typeorm';

export class RolesPermisos1749667400000 implements MigrationInterface {
  name = 'RolesPermisos1749667400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE roles ADD permisos nvarchar(max) NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE roles DROP COLUMN permisos;`);
  }
}
