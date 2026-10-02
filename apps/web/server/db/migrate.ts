import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set. Migration aborted.');
  process.exit(1);
}

async function runMigrations() {
  console.log('Running database migrations...');
  const migrationClient = postgres(connectionString!, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const migrationsFolder = path.resolve(currentDir, 'migrations');
    await migrate(db, { migrationsFolder });
    console.log('Migrations applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

runMigrations();
