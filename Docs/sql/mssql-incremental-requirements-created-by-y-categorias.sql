-- HealthPlus — incremental MSSQL (manual / referencia).
-- Equivalente a las migraciones TypeORM:
--   1750120000000-RequirementCreatedBy.ts
--   1750130000000-RequirementCategorias.ts
-- Preferir `npm run migration:run` en backend cuando sea posible.

-- Creador del requisito (inmutable en aplicación)
IF COL_LENGTH('requirements', 'created_by_user_id') IS NULL
BEGIN
  ALTER TABLE requirements ADD created_by_user_id INT NULL;
  ALTER TABLE requirements ADD CONSTRAINT FK_requirements_created_by_user
    FOREIGN KEY (created_by_user_id) REFERENCES users(id);
END
GO

-- Categorías múltiples (JSON de slugs; compatibilidad con columna `categoria`)
IF COL_LENGTH('requirements', 'categorias') IS NULL
BEGIN
  ALTER TABLE requirements ADD categorias NVARCHAR(MAX) NULL;
END
GO
