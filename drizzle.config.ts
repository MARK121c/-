import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/backend/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite', // Also compatible with LibSQL
  dbCredentials: {
    url: 'file:./data/sqlite.db',
  },
});
