/**
 * MARK EMAD — Academic Hub Server
 * Express server with SQLite, JWT auth, file uploads
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Database Setup ──
const dbDir = path.dirname(process.env.DB_PATH || './data/sqlite.db');
fs.mkdirSync(dbDir, { recursive: true });

const db = createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

// Run schema on first start
const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
if (!tableExists) {
  console.log('🔧 Initializing database schema...');
  const schema = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
  // Split by semicolons and execute each statement
  schema.split(';').filter(s => s.trim()).forEach(stmt => {
    try {
      db.exec(stmt + ';');
    } catch (e) {
      // Skip PRAGMA statements that might fail in exec context
      if (!stmt.trim().startsWith('PRAGMA')) {
        console.error('Schema error:', e.message);
      }
    }
  });
  console.log('✅ Database initialized successfully');
} else {
  console.log('✅ Database loaded');
}

// Make db available to routes
app.set('db', db);

// ── Middleware ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Create Upload Directories ──
const uploadDirs = ['uploads/lectures', 'uploads/assignments', 'uploads/videos'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  fs.mkdirSync(fullPath, { recursive: true });
});

// ── Static Files ──
// Serve the existing portfolio files
app.use(express.static(__dirname));

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ──
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/academic', require('./routes/academic.routes'));
app.use('/api/materials', require('./routes/materials.routes'));
app.use('/api/sync', require('./routes/sync.routes'));

// ── File Download Route ──
app.get('/api/download/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  const validTypes = ['lectures', 'assignments', 'videos'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }
  const filePath = path.join(__dirname, 'uploads', type, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.download(filePath);
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║     MARK EMAD — Academic Hub Server          ║
║     Running on http://localhost:${PORT}          ║
║                                              ║
║     Portfolio:  http://localhost:${PORT}          ║
║     Academic:   http://localhost:${PORT}/academic-login.html ║
║     Default Login: admin / admin123          ║
╚══════════════════════════════════════════════╝
  `);
});

// ── Graceful Shutdown ──
process.on('SIGINT', () => {
  console.log('\n🔒 Closing database and shutting down...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔒 Closing database and shutting down...');
  db.close();
  process.exit(0);
});
