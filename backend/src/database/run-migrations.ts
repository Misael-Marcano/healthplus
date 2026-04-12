import 'reflect-metadata';
import { config } from 'dotenv';
import { AppDataSource } from './data-source';

config();

async function main() {
  await AppDataSource.initialize();
  try {
    const executed = await AppDataSource.runMigrations({ transaction: 'each' });
    // eslint-disable-next-line no-console
    console.log(
      'Migraciones ejecutadas:',
      executed.map((m) => m.name).join(', ') || '(ninguna nueva)',
    );
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
