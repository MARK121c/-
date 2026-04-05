import { createClient } from '@libsql/client';

const url = process.env.DATABASE_URL || 'file:./data/sqlite.db';

export async function ensureTables() {
  const client = createClient({ url });
  console.log('--- STARTING AUTONOMOUS MIGRATION (Coolify Ready) ---');

  try {
    // 1. Sessions
    await client.execute(`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, device_label TEXT, ip_address TEXT, created_at INTEGER NOT NULL, last_seen INTEGER NOT NULL)`);
    // 2. Settings
    await client.execute(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
    // 3. Transactions
    await client.execute(`CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL NOT NULL, currency TEXT DEFAULT 'EGP', category TEXT NOT NULL, method TEXT NOT NULL, status TEXT NOT NULL, description TEXT NOT NULL, is_essential INTEGER DEFAULT 1, date TEXT NOT NULL)`);
    // 4. Incomes
    await client.execute(`CREATE TABLE IF NOT EXISTS incomes (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL NOT NULL, currency TEXT DEFAULT 'EGP', description TEXT NOT NULL, date TEXT NOT NULL)`);
    // 5. Assets
    await client.execute(`CREATE TABLE IF NOT EXISTS assets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL, value REAL NOT NULL, currency TEXT DEFAULT 'EGP', roi REAL DEFAULT 0, passive_income REAL DEFAULT 0, date TEXT NOT NULL)`);
    // 6. Wishlist
    await client.execute(`CREATE TABLE IF NOT EXISTS wishlist (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price REAL NOT NULL, currency TEXT DEFAULT 'EGP', link TEXT, priority INTEGER DEFAULT 1, date TEXT NOT NULL)`);
    
    console.log('--- TABLES VERIFIED SUCCESSFULLY ---');
  } catch (error) {
    console.error('AUTONOMOUS MIGRATION FAILED:', error);
  }
}
