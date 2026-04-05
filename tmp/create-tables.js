const { createClient } = require('@libsql/client');

async function main() {
  const client = createClient({
    url: 'file:./data/sqlite.db',
  });

  console.log('--- STARTING MANUAL MIGRATION (OS v4 JS) ---');

  try {
    // 1. Sessions Table
    console.log('Creating sessions table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        device_label TEXT,
        ip_address TEXT,
        created_at INTEGER NOT NULL,
        last_seen INTEGER NOT NULL
      )
    `);

    // 2. Settings Table
    console.log('Creating settings table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // 3. Transactions Table
    console.log('Creating transactions table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'EGP',
        category TEXT NOT NULL,
        method TEXT NOT NULL,
        status TEXT NOT NULL,
        description TEXT NOT NULL,
        is_essential INTEGER DEFAULT 1,
        date TEXT NOT NULL
      )
    `);

    // 4. Incomes Table
    console.log('Creating incomes table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS incomes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'EGP',
        description TEXT NOT NULL,
        date TEXT NOT NULL
      )
    `);

    // 5. Assets Table
    console.log('Creating assets table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        value REAL NOT NULL,
        currency TEXT DEFAULT 'EGP',
        roi REAL DEFAULT 0,
        passive_income REAL DEFAULT 0,
        date TEXT NOT NULL
      )
    `);

    // 6. Wishlist Table
    console.log('Creating wishlist table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        currency TEXT DEFAULT 'EGP',
        link TEXT,
        priority INTEGER DEFAULT 1,
        date TEXT NOT NULL
      )
    `);

    console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('MIGRATION FAILED:', error);
  } finally {
    process.exit(0);
  }
}

main();
