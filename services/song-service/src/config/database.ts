import { DataSource } from 'typeorm';
import { Song } from '../song/song.model';

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, NODE_ENV } = process.env;

if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  throw new Error('Missing required database environment variables.');
}

const isProduction = NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  
  // 1. Data Loss / Schema Corruption Vulnerability: 
  // 'synchronize: true' automatically drops/modifies tables. NEVER use in production.
  synchronize: false, 
  
  // 2. Information Exposure: 
  // Limit logging in production so sensitive query data isn't leaked into logs.
  logging: isProduction ? ['error'] : true,

  // 3. Man-In-The-Middle (MITM) Vulnerability: 
  // Enforce SSL connections to the database in production.
  ssl: isProduction ? { rejectUnauthorized: true } : false,
  
  entities: [Song], 
  
  // Use migrations for schema changes instead of synchronize
  migrations: ['src/migration/**/*.ts'],
});