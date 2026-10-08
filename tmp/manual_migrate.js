const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:./data/sqlite.db' });

async function migrate() {
  try {
    console.log('Running manual migration...');
    // Add notes to wishlist if missing
    try {
      await client.execute(`ALTER TABLE wishlist ADD COLUMN notes TEXT`);
      console.log('Added notes column to wishlist.');
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        console.log('Notes column already exists.');
      } else {
        throw e;
      }
    }
    console.log('Migration complete.');
  } catch (e) {
    console.error('Migration failed:', e.message);
  }
}

migrate();
