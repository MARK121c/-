import { createClient } from '@libsql/client';

const url = process.env.DATABASE_URL || 'file:./data/sqlite.db';

export async function ensureTables() {
  const client = createClient({ url });
  console.log('--- STARTING AGGRESSIVE SCHEMA REPAIR (v4.2) ---');

  try {
    // 1. Create tables if they don't exist
    await client.execute(\`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, device_label TEXT, ip_address TEXT, created_at INTEGER NOT NULL, last_seen INTEGER NOT NULL)\`);
    await client.execute(\`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)\`);
    await client.execute(\`CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL NOT NULL, currency TEXT DEFAULT 'EGP', category TEXT NOT NULL, method TEXT NOT NULL, status TEXT NOT NULL, description TEXT NOT NULL, is_essential INTEGER DEFAULT 1, date TEXT NOT NULL)\`);
    await client.execute(\`CREATE TABLE IF NOT EXISTS incomes (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL NOT NULL, currency TEXT DEFAULT 'EGP', description TEXT NOT NULL, date TEXT NOT NULL)\`);
    await client.execute(\`CREATE TABLE IF NOT EXISTS assets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL, value REAL NOT NULL, currency TEXT DEFAULT 'EGP', roi REAL DEFAULT 0, passive_income REAL DEFAULT 0, date TEXT NOT NULL)\`);
    await client.execute(\`CREATE TABLE IF NOT EXISTS wishlist (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price REAL NOT NULL, currency TEXT DEFAULT 'EGP', link TEXT, priority INTEGER DEFAULT 1, date TEXT NOT NULL)\`);

    // 2. Aggressive Schema Update (Ensuring columns exist in old tables)
    const repairs = [
      "ALTER TABLE assets ADD COLUMN passive_income REAL DEFAULT 0",
      "ALTER TABLE assets ADD COLUMN roi REAL DEFAULT 0",
      "ALTER TABLE assets ADD COLUMN currency TEXT DEFAULT 'EGP'",
      "ALTER TABLE transactions ADD COLUMN is_essential INTEGER DEFAULT 1",
      "ALTER TABLE transactions ADD COLUMN method TEXT DEFAULT 'كاش'",
      "ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT 'تم الصرف'",
    ];

    for (const sql of repairs) {
      try {
        await client.execute(sql);
        console.log(\`REPAIR SUCCESS: \${sql}\`);
      } catch (err) {
        // Ignore "duplicate column name" error (SQLite error code 1)
        console.log(\`REPAIR SKIPPED (Already fixed): \${sql}\`);
      }
    }

    console.log('--- AGGRESSIVE REPAIR COMPLETED ---');
  } catch (error) {
    console.error('CRITICAL MIGRATION ERROR:', error);
  }
}
