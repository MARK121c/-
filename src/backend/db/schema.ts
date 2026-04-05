import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// --- SECURITY & SESSIONS ---
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // The JWT token itself or a hash of it
  userId: text('user_id').notNull(),
  deviceLabel: text('device_label'),
  ipAddress: text('ip_address'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastSeen: integer('last_seen', { mode: 'timestamp' }).notNull(),
});

// --- SYSTEM SETTINGS --- (USD Rate, Ratios, Work Hours)
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// --- CORE FINANCIALS ---
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amount: real('amount').notNull(),
  currency: text('currency').default('EGP'), // EGP or USD
  category: text('category').notNull(), // شغل، سكن، ترفيه، استثمار، إلخ
  method: text('method').notNull(), // كاش، فيزا، انستا باي، تحويل بنكي
  status: text('status').notNull(), // تم الصرف، معلق، اشتراك شهري، سنوي
  description: text('description').notNull(),
  isEssential: integer('is_essential', { mode: 'boolean' }).default(true), // For Panic Button logic
  date: text('date').notNull(), // ISO
});

export const incomes = sqliteTable('incomes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amount: real('amount').notNull(),
  currency: text('currency').default('EGP'),
  description: text('description').notNull(),
  date: text('date').notNull(),
});

export const assets = sqliteTable('assets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // Bank, Gold, Crypto, Cash, Equipment
  value: real('value').notNull(), // Primary value
  currency: text('currency').default('EGP'),
  roi: real('roi').default(0), // % Return on investment
  passiveIncome: real('passive_income').default(0), // Monthly passive income
  date: text('date').notNull(),
});

// --- WISHLIST ---
export const wishlist = sqliteTable('wishlist', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  price: real('price').notNull(),
  currency: text('currency').default('EGP'),
  link: text('link'),
  priority: integer('priority').default(1),
  date: text('date').notNull(),
});
