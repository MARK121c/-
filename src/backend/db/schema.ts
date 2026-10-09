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
  notes: text('notes'),
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

// --- ROUTINES & LIFESTYLE OS ---
export const routines = sqliteTable('routines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').default('daily'), // daily | weekly | monthly
  category: text('category').default('health'), // health | hygiene | productivity | relax
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  daysOfWeek: text('days_of_week'), // JSON array like "[1,3,5]"
  createdAt: text('created_at').notNull(),
});

export const routineSteps = sqliteTable('routine_steps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  routineId: integer('routine_id').notNull(),
  stepName: text('step_name').notNull(),
  stepOrder: integer('step_order').default(0),
  estimatedTime: integer('estimated_time').default(5), // minutes
  isRequired: integer('is_required', { mode: 'boolean' }).default(true),
  productId: integer('product_id'), // linked to grooming_products
});

export const routineLogs = sqliteTable('routine_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // daily log
  dailyScore: integer('daily_score').default(0), // percentage
  streak: integer('streak').default(0),
});

export const routineStepLogs = sqliteTable('routine_step_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  routineId: integer('routine_id').notNull(),
  stepId: integer('step_id').notNull(),
  date: text('date').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false),
});

// --- GROOMING & PERSONAL CARE ---
export const groomingProducts = sqliteTable('grooming_products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').default('Skincare'), // Skincare | Hair | Perfume | Supplements
  quantity: integer('quantity').default(1),
  startDate: text('start_date'),
  expiryDate: text('expiry_date'), 
  estimatedDurationDays: integer('estimated_duration_days').default(30),
  usagePerDay: real('usage_per_day').default(1.0), // frequency matching
  reminderDaysBefore: integer('reminder_days_before').default(10),
  linkedRoutines: text('linked_routines'), // JSON array of routine IDs
  status: text('status').default('active'), // active | warning | finished
});

// --- PEOPLE & RELATIONSHIPS ---
export const people = sqliteTable('people', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  relationship: text('relationship').default('friend'), // friend | family | business | other
  notes: text('notes'),
  importanceLevel: integer('importance_level').default(3), // 1-5
  lastInteraction: text('last_interaction'), // date
  createdAt: text('created_at').notNull(),
});

// --- EVENTS & REMINDERS ---
export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  type: text('type').default('reminder'), // birthday | meeting | reminder | holiday
  date: text('date').notNull(), // Format: YYYY-MM-DD
  time: text('time'), // Format: HH:mm
  endTime: text('end_time'), // Format: HH:mm
  repeat: text('repeat').default('none'), // none | yearly | monthly
  priority: text('priority').default('medium'), // low | medium | high
  status: text('status').default('upcoming'), // upcoming | done | missed
  personId: integer('person_id'), // optional link to people
  reminderBeforeDays: integer('reminder_before_days').default(1),
  notes: text('notes'),
});

export const eventLogs = sqliteTable('event_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventId: integer('event_id').notNull(),
  status: text('status').default('done'), // done | missed
  date: text('date').notNull(), // Actual date it happened (useful for recurring)
});

// --- RECURRING SUBSCRIPTIONS OS ---
export const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').default('business'), // business | personal | tools | health
  amount: real('amount').notNull(),
  currency: text('currency').default('EGP'),
  billingCycle: text('billing_cycle').default('monthly'), // monthly | yearly | custom
  billingInterval: integer('billing_interval').default(1),
  startDate: text('start_date').notNull(),
  nextPaymentDate: text('next_payment_date').notNull(),
  status: text('status').default('active'), // active | upcoming | due | paid | paused | canceled
  isEssential: integer('is_essential', { mode: 'boolean' }).default(true),
  linkedAccount: text('linked_account').default('cash'), // cash | visa | instapay
});

export const subscriptionPayments = sqliteTable('subscription_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subscriptionId: integer('subscription_id').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').default('EGP'),
  paymentDate: text('payment_date').notNull(),
});

// --- KNOWLEDGE & EXECUTION LIBRARY (Makhzan OS) ---
export const resources = sqliteTable('resources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  type: text('type').notNull(), // video | tool | idea | link
  url: text('url'),
  thumbnail: text('thumbnail'),
  category: text('category').default('learning'), // learning | business | personal
  status: text('status').default('pending'), // pending | in_progress | done
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const resourceTags = sqliteTable('resource_tags', {
  resourceId: integer('resource_id').notNull(),
  tagId: integer('tag_id').notNull(),
});

export const resourceCategories = sqliteTable('resource_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').default('#3b82f6'), // Default blue
  icon: text('icon').default('Layers'),
});

// --- ACADEMIC HUB (الدراسة والكلية) ---
export const academicSettings = sqliteTable('academic_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  collegeName: text('college_name').default(''),
  department: text('department').default(''),
  academicYear: text('academic_year').default(''),
  sectionNumber: text('section_number').default(''),
  updatedAt: text('updated_at'),
});

export const academicSubjects = sqliteTable('academic_subjects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  code: text('code').default(''),
  color: text('color').default('#FF6B00'),
  icon: text('icon').default('📘'),
  driveFolderUrl: text('drive_folder_url').default(''),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

export const academicLectures = sqliteTable('academic_lectures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subjectId: integer('subject_id').notNull(),
  title: text('title').notNull(),
  description: text('description').default(''),
  filePath: text('file_path').default(''),
  fileName: text('file_name').default(''),
  fileSize: integer('file_size').default(0),
  materialDate: text('material_date'),
  uploadTimestamp: text('upload_timestamp'),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  createdBy: text('created_by').default('owner'),
  synced: integer('synced', { mode: 'boolean' }).default(true),
});

export const academicAssignments = sqliteTable('academic_assignments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subjectId: integer('subject_id').notNull(),
  title: text('title').notNull(),
  description: text('description').default(''),
  dueDate: text('due_date'),
  filePath: text('file_path').default(''),
  fileName: text('file_name').default(''),
  materialDate: text('material_date'),
  uploadTimestamp: text('upload_timestamp'),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  createdBy: text('created_by').default('owner'),
  synced: integer('synced', { mode: 'boolean' }).default(true),
});

export const academicMaterialsResources = sqliteTable('academic_materials_resources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subjectId: integer('subject_id').notNull(),
  title: text('title').notNull(),
  description: text('description').default(''),
  url: text('url').default(''),
  resourceType: text('resource_type').default('link'),
  materialDate: text('material_date'),
  uploadTimestamp: text('upload_timestamp'),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  createdBy: text('created_by').default('owner'),
  synced: integer('synced', { mode: 'boolean' }).default(true),
});

export const academicVideos = sqliteTable('academic_videos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subjectId: integer('subject_id').notNull(),
  title: text('title').notNull(),
  description: text('description').default(''),
  videoUrl: text('video_url').default(''),
  filePath: text('file_path').default(''),
  videoType: text('video_type').default('youtube'),
  duration: text('duration').default(''),
  materialDate: text('material_date'),
  uploadTimestamp: text('upload_timestamp'),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  createdBy: text('created_by').default('owner'),
  synced: integer('synced', { mode: 'boolean' }).default(true),
});

export const academicUsers = sqliteTable('academic_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(),
  displayName: text('display_name').default(''),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

export const academicSyncLog = sqliteTable('academic_sync_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  syncedBy: text('synced_by'),
  syncType: text('sync_type').default('full'),
  itemsSynced: integer('items_synced').default(0),
  syncedAt: text('synced_at'),
});

// --- COURSES & LEARNING HUB (CLASSROOM OS - SKOOL STYLE) ---
export const courses = sqliteTable('courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').default(''),
  thumbnailUrl: text('thumbnail_url').default(''),
  category: text('category').default('general'),
  instructor: text('instructor').default('Mark Emad'),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at'),
});

export const courseModules = sqliteTable('course_modules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseId: integer('course_id').notNull(),
  title: text('title').notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull(),
});

export const courseLessons = sqliteTable('course_lessons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseId: integer('course_id').notNull(),
  moduleId: integer('module_id').notNull(),
  title: text('title').notNull(),
  description: text('description').default(''),
  videoUrl: text('video_url').default(''), // YouTube / Loom / Vimeo / Drive embed
  duration: text('duration').default(''),
  notes: text('notes').default(''),
  attachments: text('attachments').default('[]'), // JSON array of { name, url, type }
  completed: integer('completed', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull(),
});

export const courseProgress = sqliteTable('course_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseId: integer('course_id').notNull(),
  lessonId: integer('lesson_id').notNull(),
  userId: text('user_id').default('owner'),
  completed: integer('completed', { mode: 'boolean' }).default(true),
  completedAt: text('completed_at').notNull(),
});

// --- BRAIN DUMP & QUICK NOTES OS (تفريغ الأفكار) ---
export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').default(''),
  content: text('content').notNull(),
  category: text('category').default('عام'),
  color: text('color').default('orange'),
  tags: text('tags').default('[]'),
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
  checklist: text('checklist').default('[]'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at'),
});



