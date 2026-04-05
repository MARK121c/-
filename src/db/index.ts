import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const url = process.env.DATABASE_URL || 'file:./data/sqlite.db';

const client = createClient({ 
  url,
  // authToken: process.env.DATABASE_AUTH_TOKEN, // Optional for Turso 
});

export const db = drizzle(client, { schema });
