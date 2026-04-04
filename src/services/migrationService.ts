import { getDb } from './db';

interface Migration {
  version: number;
  name: string;
  sql: string;
}

export async function runMigrations(
  migrations: Migration[]
): Promise<void> {
  const db = await getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);

  for (const migration of migrations) {
    const existing = await db.select<{ version: number }[]>(
      'SELECT version FROM schema_migrations WHERE version = ?',
      [migration.version]
    );

    if (existing.length === 0) {
      await db.execute(migration.sql);
      await db.execute(
        'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
        [migration.version, migration.name]
      );
    }
  }
}
