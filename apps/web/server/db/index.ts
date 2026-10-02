import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';
import * as schema from './schema';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const connectionString = process.env.DATABASE_URL || '';

// Single client instance per process in Node / serverless warm containers
const client = postgres(connectionString, {
  prepare: false,
  max: 10,
});

export const db = drizzle(client, { schema });
export type Database = typeof db;
export * from './schema';
