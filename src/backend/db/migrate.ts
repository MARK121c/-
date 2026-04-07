import { createClient } from '@libsql/client';

const url = process.env.DATABASE_URL || 'file:./data/sqlite.db';

export async function ensureTables() {
  const client = createClient({ url });
  const logs: string[] = [];
  logs.push(`--- DB: ${url} ---`);

  try {
    // 1. Core system tables
    await client.execute(`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, device_label TEXT, ip_address TEXT, created_at INTEGER NOT NULL, last_seen INTEGER NOT NULL)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);

    // 2. Financial tables
    await client.execute(`CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL NOT NULL, currency TEXT DEFAULT 'EGP', category TEXT NOT NULL, method TEXT NOT NULL DEFAULT 'كاش', status TEXT NOT NULL DEFAULT 'تم الصرف', description TEXT NOT NULL, is_essential INTEGER DEFAULT 1, date TEXT NOT NULL)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS incomes (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL NOT NULL, currency TEXT DEFAULT 'EGP', source TEXT DEFAULT 'عام', description TEXT NOT NULL, distributed INTEGER DEFAULT 0, date TEXT NOT NULL)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS assets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL, liquid_type TEXT DEFAULT 'مادي', value REAL NOT NULL, currency TEXT DEFAULT 'EGP', roi REAL DEFAULT 0, passive_income REAL DEFAULT 0, date TEXT NOT NULL)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS wishlist (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price REAL NOT NULL, currency TEXT DEFAULT 'EGP', link TEXT, hours_cost REAL DEFAULT 0, priority INTEGER DEFAULT 1, is_purchased INTEGER DEFAULT 0, date TEXT NOT NULL)`);

    // 3. New Smart Tables
    await client.execute(`CREATE TABLE IF NOT EXISTS investments (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, platform TEXT DEFAULT '', initial_value REAL NOT NULL, current_value REAL NOT NULL, roi_percentage REAL DEFAULT 0, currency TEXT DEFAULT 'EGP', date TEXT NOT NULL)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS passive_income_sources (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL, monthly_amount REAL NOT NULL, type TEXT DEFAULT 'اشتراك', currency TEXT DEFAULT 'EGP', is_active INTEGER DEFAULT 1)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS wallets (id TEXT PRIMARY KEY, type TEXT NOT NULL, balance REAL DEFAULT 0, currency TEXT DEFAULT 'EGP')`);
    await client.execute(`CREATE TABLE IF NOT EXISTS income_distribution (id INTEGER PRIMARY KEY AUTOINCREMENT, giving_percentage REAL DEFAULT 0.1, obligations_percentage REAL DEFAULT 0.2, personal_percentage REAL DEFAULT 0.1, investment_percentage REAL DEFAULT 0.6)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS work_tracking (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, hours_worked REAL NOT NULL, note TEXT DEFAULT '')`);

    // 5. Task Management Matrix tables
    await client.execute(`CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, status TEXT DEFAULT 'pending', type TEXT DEFAULT 'inbox', priority TEXT DEFAULT 'medium', estimated_time INTEGER DEFAULT 30, day_of_week INTEGER, position INTEGER DEFAULT 0, is_sub_task INTEGER DEFAULT 0, date TEXT NOT NULL, completed_at TEXT)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS daily_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL UNIQUE, completed_tasks INTEGER DEFAULT 0, total_tasks INTEGER DEFAULT 0, completed_core INTEGER DEFAULT 0, focus_score INTEGER DEFAULT 0, streak_day INTEGER DEFAULT 0, closed_at TEXT)`);

    // 6. Routine & Lifestyle OS tables
    await client.execute(`CREATE TABLE IF NOT EXISTS routines (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT DEFAULT 'daily', category TEXT DEFAULT 'health', is_active INTEGER DEFAULT 1, days_of_week TEXT, created_at TEXT NOT NULL)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS routine_steps (id INTEGER PRIMARY KEY AUTOINCREMENT, routine_id INTEGER NOT NULL, step_name TEXT NOT NULL, step_order INTEGER DEFAULT 0, estimated_time INTEGER DEFAULT 5, is_required INTEGER DEFAULT 1, product_id INTEGER)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS routine_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL UNIQUE, daily_score INTEGER DEFAULT 0, streak INTEGER DEFAULT 0)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS routine_step_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, routine_id INTEGER NOT NULL, step_id INTEGER NOT NULL, date TEXT NOT NULL, completed INTEGER DEFAULT 0)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS grooming_products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT DEFAULT 'Skincare', quantity INTEGER DEFAULT 1, start_date TEXT, expiry_date TEXT, estimated_duration_days INTEGER DEFAULT 30, usage_per_day REAL DEFAULT 1.0, reminder_days_before INTEGER DEFAULT 10, linked_routines TEXT, status TEXT DEFAULT 'active')`);

    // 7. Recurring Subscriptions OS tables
    await client.execute(`CREATE TABLE IF NOT EXISTS subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT DEFAULT 'business', amount REAL NOT NULL, currency TEXT DEFAULT 'EGP', billing_cycle TEXT DEFAULT 'monthly', billing_interval INTEGER DEFAULT 1, start_date TEXT NOT NULL, next_payment_date TEXT NOT NULL, status TEXT DEFAULT 'active', is_essential INTEGER DEFAULT 1, linked_account TEXT DEFAULT 'cash')`);
    await client.execute(`CREATE TABLE IF NOT EXISTS subscription_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, subscription_id INTEGER NOT NULL, amount REAL NOT NULL, currency TEXT DEFAULT 'EGP', payment_date TEXT NOT NULL)`);

    // 8. People & Events OS tables
    await client.execute(`CREATE TABLE IF NOT EXISTS people (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, relationship TEXT DEFAULT 'friend', notes TEXT, importance_level INTEGER DEFAULT 3, last_interaction TEXT, created_at TEXT NOT NULL)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, type TEXT DEFAULT 'reminder', date TEXT NOT NULL, repeat TEXT DEFAULT 'none', person_id INTEGER, reminder_before_days INTEGER DEFAULT 1, notes TEXT)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS event_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL, status TEXT DEFAULT 'done', date TEXT NOT NULL)`);

    // 9. Knowledge & Execution Library (Makhzan OS) tables
    await client.execute(`CREATE TABLE IF NOT EXISTS resources (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, type TEXT NOT NULL, url TEXT, thumbnail TEXT, category TEXT DEFAULT 'learning', status TEXT DEFAULT 'pending', notes TEXT, created_at TEXT NOT NULL)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS resource_tags (resource_id INTEGER NOT NULL, tag_id INTEGER NOT NULL)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS resource_categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, color TEXT DEFAULT '#3b82f6', icon TEXT DEFAULT 'Layers')`);
    // 4. Seed default wallets if missing
    const walletCheck = await client.execute(`SELECT id FROM wallets LIMIT 1`);
    if (walletCheck.rows.length === 0) {
      await client.execute(`INSERT OR IGNORE INTO wallets (id, type, balance) VALUES ('giving', 'عطاء (لله)', 0)`);
      await client.execute(`INSERT OR IGNORE INTO wallets (id, type, balance) VALUES ('obligations', 'التزامات', 0)`);
      await client.execute(`INSERT OR IGNORE INTO wallets (id, type, balance) VALUES ('personal', 'شخصي', 0)`);
      await client.execute(`INSERT OR IGNORE INTO wallets (id, type, balance) VALUES ('investment', 'استثمار', 0)`);
      logs.push('SEEDED: Default wallets created');
    }

    // 5. Seed default income distribution if missing
    const distCheck = await client.execute(`SELECT id FROM income_distribution LIMIT 1`);
    if (distCheck.rows.length === 0) {
      await client.execute(`INSERT INTO income_distribution (giving_percentage, obligations_percentage, personal_percentage, investment_percentage) VALUES (0.1, 0.2, 0.1, 0.6)`);
      logs.push('SEEDED: Default income distribution 10/20/10/60');
    }

    // 6. Add missing columns to existing tables (safe migrations)
    const addIfMissing = async (table: string, col: string, sqlStr: string) => {
      try {
        const res = await client.execute(`PRAGMA table_info(${table})`);
        // libsql rows are array-like: index 0=cid, 1=name, 2=type, etc.
        const exists = res.rows.some((r: any) => {
          // Try both named property and positional index
          return r.name === col || r[1] === col || String(r[1]) === col;
        });
        if (!exists) {
          await client.execute(sqlStr);
          logs.push(`ADDED: ${table}.${col}`);
        } else {
          logs.push(`EXISTS: ${table}.${col}`);
        }
      } catch (e: any) {
        logs.push(`WARN addIfMissing ${table}.${col}: ${e.message}`);
      }
    };
    await addIfMissing('transactions', 'method', `ALTER TABLE transactions ADD COLUMN method TEXT DEFAULT 'كاش'`);
    await addIfMissing('transactions', 'status', `ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT 'تم الصرف'`);
    await addIfMissing('assets', 'passive_income', `ALTER TABLE assets ADD COLUMN passive_income REAL DEFAULT 0`);
    await addIfMissing('assets', 'roi', `ALTER TABLE assets ADD COLUMN roi REAL DEFAULT 0`);
    await addIfMissing('assets', 'liquid_type', `ALTER TABLE assets ADD COLUMN liquid_type TEXT DEFAULT 'مادي'`);
    await addIfMissing('incomes', 'source', `ALTER TABLE incomes ADD COLUMN source TEXT DEFAULT 'عام'`);
    await addIfMissing('incomes', 'distributed', `ALTER TABLE incomes ADD COLUMN distributed INTEGER DEFAULT 0`);
    await addIfMissing('wishlist', 'hours_cost', `ALTER TABLE wishlist ADD COLUMN hours_cost REAL DEFAULT 0`);
    await addIfMissing('wishlist', 'is_purchased', `ALTER TABLE wishlist ADD COLUMN is_purchased INTEGER DEFAULT 0`);
    await addIfMissing('wishlist', 'notes', `ALTER TABLE wishlist ADD COLUMN notes TEXT`);

    await addIfMissing('events', 'time', `ALTER TABLE events ADD COLUMN time TEXT`);
    await addIfMissing('events', 'end_time', `ALTER TABLE events ADD COLUMN end_time TEXT`);
    await addIfMissing('events', 'priority', `ALTER TABLE events ADD COLUMN priority TEXT DEFAULT 'medium'`);
    await addIfMissing('events', 'status', `ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'upcoming'`);

    logs.push('DONE: All tables verified');
    return { success: true, logs };
  } catch (error: any) {
    logs.push(`CRITICAL: ${error.message}`);
    return { success: false, logs };
  }
}
