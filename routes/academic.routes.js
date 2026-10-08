/**
 * Academic Routes
 * Settings, subjects CRUD, progress tracking
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireAnyRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/academic/settings
router.get('/settings', (req, res) => {
  try {
    const db = req.app.get('db');
    const settings = db.prepare('SELECT * FROM academic_settings WHERE id = 1').get();
    res.json({ success: true, settings: settings || {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/academic/settings
router.put('/settings', (req, res) => {
  try {
    const db = req.app.get('db');
    const { college_name, department, academic_year, section_number } = req.body;
    db.prepare(`
      UPDATE academic_settings 
      SET college_name = ?, department = ?, academic_year = ?, section_number = ?, updated_at = datetime('now')
      WHERE id = 1
    `).run(college_name || '', department || '', academic_year || '', section_number || '');

    const settings = db.prepare('SELECT * FROM academic_settings WHERE id = 1').get();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/academic/subjects — List all with progress
router.get('/subjects', (req, res) => {
  try {
    const db = req.app.get('db');
    const subjects = db.prepare('SELECT * FROM subjects ORDER BY sort_order, id').all();

    const subjectsWithProgress = subjects.map(sub => {
      const lCount = db.prepare('SELECT COUNT(*) as total, SUM(completed) as done FROM lectures WHERE subject_id = ?').get(sub.id);
      const aCount = db.prepare('SELECT COUNT(*) as total, SUM(completed) as done FROM assignments WHERE subject_id = ?').get(sub.id);
      const rCount = db.prepare('SELECT COUNT(*) as total, SUM(completed) as done FROM resources WHERE subject_id = ?').get(sub.id);
      const vCount = db.prepare('SELECT COUNT(*) as total, SUM(completed) as done FROM videos WHERE subject_id = ?').get(sub.id);

      const total = (lCount.total || 0) + (aCount.total || 0) + (rCount.total || 0) + (vCount.total || 0);
      const done = (lCount.done || 0) + (aCount.done || 0) + (rCount.done || 0) + (vCount.done || 0);

      return {
        ...sub,
        stats: {
          lectures: lCount.total || 0,
          assignments: aCount.total || 0,
          resources: rCount.total || 0,
          videos: vCount.total || 0,
          total,
          completed: done,
          percentage: total > 0 ? Math.round((done / total) * 100) : 0
        }
      };
    });

    res.json({ success: true, subjects: subjectsWithProgress });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/academic/subjects
router.post('/subjects', requireAnyRole, (req, res) => {
  try {
    const db = req.app.get('db');
    const { name, code, color, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Subject name is required' });

    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM subjects').get();
    const result = db.prepare(
      'INSERT INTO subjects (name, code, color, icon, sort_order) VALUES (?, ?, ?, ?, ?)'
    ).run(name, code || '', color || '#FF6B00', icon || '📘', (maxOrder.max || 0) + 1);

    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, subject });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/academic/subjects/:id — Single subject with all materials
router.get('/subjects/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    if (!subject) return res.status(404).json({ success: false, error: 'Subject not found' });

    const lectures = db.prepare('SELECT * FROM lectures WHERE subject_id = ? ORDER BY sort_order, id').all(req.params.id);
    const assignments = db.prepare('SELECT * FROM assignments WHERE subject_id = ? ORDER BY sort_order, id').all(req.params.id);
    const resources = db.prepare('SELECT * FROM resources WHERE subject_id = ? ORDER BY sort_order, id').all(req.params.id);
    const videos = db.prepare('SELECT * FROM videos WHERE subject_id = ? ORDER BY sort_order, id').all(req.params.id);

    const allItems = [...lectures, ...assignments, ...resources, ...videos];
    const total = allItems.length;
    const done = allItems.filter(i => i.completed).length;

    res.json({
      success: true,
      subject: {
        ...subject,
        lectures, assignments, resources, videos,
        stats: {
          lectures: lectures.length, assignments: assignments.length,
          resources: resources.length, videos: videos.length,
          total, completed: done,
          percentage: total > 0 ? Math.round((done / total) * 100) : 0
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/academic/subjects/:id
router.put('/subjects/:id', requireAnyRole, (req, res) => {
  try {
    const db = req.app.get('db');
    const { name, code, color, icon } = req.body;
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    if (!subject) return res.status(404).json({ success: false, error: 'Subject not found' });

    db.prepare(`
      UPDATE subjects SET name = ?, code = ?, color = ?, icon = ?, updated_at = datetime('now') WHERE id = ?
    `).run(name || subject.name, code !== undefined ? code : subject.code, color || subject.color, icon || subject.icon, req.params.id);

    const updated = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    res.json({ success: true, subject: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/academic/subjects/:id
router.delete('/subjects/:id', requireAnyRole, (req, res) => {
  try {
    const db = req.app.get('db');
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    if (!subject) return res.status(404).json({ success: false, error: 'Subject not found' });

    db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/academic/progress/overall
router.get('/progress/overall', (req, res) => {
  try {
    const db = req.app.get('db');
    const tables = ['lectures', 'assignments', 'resources', 'videos'];
    let total = 0, done = 0;

    tables.forEach(table => {
      const row = db.prepare(`SELECT COUNT(*) as total, SUM(completed) as done FROM ${table}`).get();
      total += row.total || 0;
      done += row.done || 0;
    });

    res.json({
      success: true,
      progress: {
        total, completed: done,
        percentage: total > 0 ? Math.round((done / total) * 100) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
