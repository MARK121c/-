-- Academic Hub Database Schema
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- Users table (owner + assistants)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner','assistant')),
  display_name TEXT DEFAULT '',
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Academic settings
CREATE TABLE IF NOT EXISTS academic_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  college_name TEXT DEFAULT '',
  department TEXT DEFAULT '',
  academic_year TEXT DEFAULT '',
  section_number TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Subjects / Courses
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT DEFAULT '',
  color TEXT DEFAULT '#FF6B00',
  icon TEXT DEFAULT '📘',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Lectures / PDF Notes
CREATE TABLE IF NOT EXISTS lectures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_path TEXT DEFAULT '',
  file_name TEXT DEFAULT '',
  file_size INTEGER DEFAULT 0,
  material_date TEXT DEFAULT (date('now')),
  upload_timestamp TEXT DEFAULT (datetime('now')),
  completed INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_by TEXT DEFAULT 'owner',
  synced INTEGER DEFAULT 1
);

-- Assignments / Tasks
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date TEXT,
  file_path TEXT DEFAULT '',
  file_name TEXT DEFAULT '',
  material_date TEXT DEFAULT (date('now')),
  upload_timestamp TEXT DEFAULT (datetime('now')),
  completed INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_by TEXT DEFAULT 'owner',
  synced INTEGER DEFAULT 1
);

-- External Resources
CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  url TEXT DEFAULT '',
  resource_type TEXT DEFAULT 'link',
  material_date TEXT DEFAULT (date('now')),
  upload_timestamp TEXT DEFAULT (datetime('now')),
  completed INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_by TEXT DEFAULT 'owner',
  synced INTEGER DEFAULT 1
);

-- Videos
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  file_path TEXT DEFAULT '',
  video_type TEXT DEFAULT 'youtube' CHECK(video_type IN ('youtube','upload','external')),
  duration TEXT DEFAULT '',
  material_date TEXT DEFAULT (date('now')),
  upload_timestamp TEXT DEFAULT (datetime('now')),
  completed INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_by TEXT DEFAULT 'owner',
  synced INTEGER DEFAULT 1
);

-- Sync log
CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  synced_by INTEGER REFERENCES users(id),
  sync_type TEXT DEFAULT 'full',
  items_synced INTEGER DEFAULT 0,
  synced_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lectures_subject ON lectures(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject ON assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_videos_subject ON videos(subject_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Default owner account (password: admin123)
INSERT OR IGNORE INTO users (username, password_hash, role, display_name)
VALUES ('admin', '$2a$10$8K1p/a0dR1xqM8cE1gXkmeQKdXeJX2fz1Z1hYVOHZ3TCSHnGmQH6G', 'owner', 'Mark Emad');

-- Default academic settings
INSERT OR IGNORE INTO academic_settings (id, college_name, department, academic_year, section_number)
VALUES (1, '', '', '', '');
