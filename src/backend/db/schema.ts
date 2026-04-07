import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// --- SECURITY & SESSIONS ---
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  deviceLabel: text('device_label'),
  ipAddress: text('ip_address'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastSeen: integer('last_seen', { mode: 'timestamp' }).notNull(),
});

// --- SYSTEM SETTINGS ---
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// --- CORE TRANSACTIONS ---
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amount: real('amount').notNull(),
  currency: text('currency').default('EGP'),
  category: text('category').notNull(),
  method: text('method').notNull(),
  status: text('status').notNull(),
  description: text('description').notNull(),
  isEssential: integer('is_essential', { mode: 'boolean' }).default(true),
  date: text('date').notNull(),
});

export const incomes = sqliteTable('incomes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amount: real('amount').notNull(),
  currency: text('currency').default('EGP'),
  source: text('source').default('general'),
  description: text('description').notNull(),
  distributed: integer('distributed', { mode: 'boolean' }).default(false),
  date: text('date').notNull(),
});

// --- ASSETS (liquid + physical + digital) ---
export const assets = sqliteTable('assets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // بنك، كاش، ذهب، كريبتو، معدات
  liquidType: text('liquid_type'),
  value: real('value').notNull(),
  currency: text('currency').default('EGP'),
  roi: real('roi').default(0),
  passiveIncome: real('passive_income').default(0),
  date: text('date').notNull(),
});

// --- INVESTMENTS ---
export const investments = sqliteTable('investments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  platform: text('platform').default(''),
  initialValue: real('initial_value').notNull(),
  currentValue: real('current_value').notNull(),
  roiPercentage: real('roi_percentage').default(0),
  currency: text('currency').default('EGP'),
  date: text('date').notNull(),
});

// --- PASSIVE INCOME SOURCES ---
export const passiveIncomeSources = sqliteTable('passive_income_sources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  source: text('source').notNull(),
  monthlyAmount: real('monthly_amount').notNull(),
  type: text('type').default('subscription'),
  currency: text('currency').default('EGP'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

// --- WALLETS (auto-filled from Income Distribution) ---
export const wallets = sqliteTable('wallets', {
  id: text('id').primaryKey(), // 'giving' | 'obligations' | 'personal' | 'investment'
  type: text('type').notNull(),
  balance: real('balance').default(0),
  currency: text('currency').default('EGP'),
});

// --- INCOME DISTRIBUTION settings ---
export const incomeDistribution = sqliteTable('income_distribution', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  givingPercentage: real('giving_percentage').default(0.1),
  obligationsPercentage: real('obligations_percentage').default(0.2),
  personalPercentage: real('personal_percentage').default(0.1),
  investmentPercentage: real('investment_percentage').default(0.6),
});

// --- WORK TRACKING (manual hours input) ---
export const workTracking = sqliteTable('work_tracking', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  hoursWorked: real('hours_worked').notNull(),
  note: text('note').default(''),
});

// --- WISHLIST (with "hours of life" cost) ---
export const wishlist = sqliteTable('wishlist', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  price: real('price').notNull(),
  currency: text('currency').default('EGP'),
  link: text('link'),
  hoursCost: real('hours_cost').default(0),
  priority: integer('priority').default(1),
  isPurchased: integer('is_purchased', { mode: 'boolean' }).default(false),
  date: text('date').notNull(),
});

// --- TASK MANAGEMENT MATRIX ---
export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  status: text('status').default('pending'), // pending | done
  type: text('type').default('inbox'),       // inbox | today | weekly
  priority: text('priority').default('medium'), // low | medium | high | critical
  estimatedTime: integer('estimated_time').default(30), // in minutes
  dayOfWeek: integer('day_of_week'),         // 0=Sun ... 6=Sat (for weekly)
  position: integer('position').default(0),   // ordering within type
  isSubTask: integer('is_sub_task', { mode: 'boolean' }).default(false),
  date: text('date').notNull(),
  completedAt: text('completed_at'),
});

export const dailyLogs = sqliteTable('daily_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(),
  completedTasks: integer('completed_tasks').default(0),
  totalTasks: integer('total_tasks').default(0),
  completedCore: integer('completed_core').default(0), // how many of the 3 core were done
  focusScore: integer('focus_score').default(0), // 0-100
  streakDay: integer('streak_day').default(0),
  closedAt: text('closed_at'),
});
