import { createClient } from '@libsql/client';

const url = process.env.DATABASE_URL || 'file:./data/sqlite.db';

export async function ensureTables() {
  const client = createClient({ url });
  const logs: string[] = [];
  logs.push(`--- URL: ${url} ---`);

  try {
    // 1. Core Tables
    await client.execute(`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, device_label TEXT, ip_address TEXT, created_at INTEGER NOT NULL, last_seen INTEGER NOT NULL)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL NOT NULL, currency TEXT DEFAULT 'EGP', category TEXT NOT NULL, method TEXT NOT NULL, status TEXT NOT NULL, description TEXT NOT NULL, is_essential INTEGER DEFAULT 1, date TEXT NOT NULL)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS incomes (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL NOT NULL, currency TEXT DEFAULT 'EGP', description TEXT NOT NULL, date TEXT NOT NULL)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS assets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL, value REAL NOT NULL, currency TEXT DEFAULT 'EGP', roi REAL DEFAULT 0, passive_income REAL DEFAULT 0, date TEXT NOT NULL)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS wishlist (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price REAL NOT NULL, currency TEXT DEFAULT 'EGP', link TEXT, priority INTEGER DEFAULT 1, date TEXT NOT NULL)`);

    // 2. Column verification for 'assets'
    const columnsRes = await client.execute("PRAGMA table_info(assets)");
    const existingColumns = columnsRes.rows.map(r => r.name);
    logs.push(`Assets Columns: ${existingColumns.join(', ')}`);

    const requiredAssets = [
      { name: 'passive_income', sql: "ALTER TABLE assets ADD COLUMN passive_income REAL DEFAULT 0" },
      { name: 'roi', sql: "ALTER TABLE assets ADD COLUMN roi REAL DEFAULT 0" },
      { name: 'currency', sql: "ALTER TABLE assets ADD COLUMN currency TEXT DEFAULT 'EGP'" }
    ];

    for (const col of requiredAssets) {
      if (!existingColumns.includes(col.name)) {
        try {
          await client.execute(col.sql);
          logs.push(`ADDED: ${col.name}`);
        } catch (e: any) {
          logs.push(`FAILED ADD ${col.name}: ${e.message}`);
        }
      }
    }

    // 3. Transactions repairs
    const transColsRes = await client.execute("PRAGMA table_info(transactions)");
    const existingTransCols = transColsRes.rows.map(r => r.name);
    
    if (!existingTransCols.includes('method')) {
      await client.execute("ALTER TABLE transactions ADD COLUMN method TEXT DEFAULT 'كاش'");
      logs.push("ADDED: transactions.method");
    }
    if (!existingTransCols.includes('status')) {
      await client.execute("ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT 'تم الصرف'");
      logs.push("ADDED: transactions.status");
    }

    return { success: true, logs };
  } catch (error: any) {
    logs.push(`CRITICAL ERROR: ${error.message}`);
    return { success: false, logs };
  }
}
