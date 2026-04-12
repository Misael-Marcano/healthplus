import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const host = process.env.DB_HOST ?? 'localhost';
const port = parseInt(process.env.DB_PORT ?? '1433', 10);

export const AppDataSource = new DataSource({
  type: 'mssql',
  host,
  port,
  username: process.env.DB_USERNAME ?? 'sa',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'healthplus_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  options: { encrypt: false, trustServerCertificate: true },
});
