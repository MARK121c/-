import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const finances = sqliteTable('finances', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  date: text('date').notNull(), // ISO format
  category: text('category').default('Uncategorized'),
});

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  status: text('status').default('Not started'),
  dueDate: text('due_date'), // ISO format
});

export const assets = sqliteTable('assets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  date: text('date').notNull(),
});

export const care = sqliteTable('care', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  task: text('task').notNull(),
  status: text('status').default('Pending'),
  date: text('date').notNull(),
});
