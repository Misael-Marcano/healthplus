import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración inicial vacía: marca el arranque de migraciones versionadas.
 * Con `synchronize: true` en desarrollo el esquema lo mantiene TypeORM.
 * Para producción (`synchronize: false`), generar migraciones reales contra una BD alineada:
 * `npm run migration:generate -- src/database/migrations/NombreDescriptivo`
 */
export class InitialPlaceholder1734398400000 implements MigrationInterface {
  name = 'InitialPlaceholder1734398400000';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Sin cambios: la tabla `migrations` registra esta versión.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Sin cambios.
  }
}
