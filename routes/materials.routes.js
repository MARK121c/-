/**
 * Materials Routes
 * CRUD for lectures, assignments, resources, videos
 * Handles file uploads via multer
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireAnyRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Multer storage config
const createStorage = (subfolder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.env.UPLOAD_DIR || './uploads', subfolder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const lectureUpload = multer({
  storage: createStorage('lectures'),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|png|jpg|jpeg|gif|webp)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  }
});

const assignmentUpload = multer({
  storage: createStorage('assignments'),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|png|jpg|jpeg|gif|webp|zip|rar)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  }
});

const videoUpload = multer({
  storage: createStorage('videos'),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(mp4|mov|avi|mkv|webm)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  }
});

// Helper: delete file safely
function deleteFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (e) { console.error('Failed to delete file:', e); }
  }
}

// ==================== LECTURES ====================

// GET /api/materials/subjects/:subjectId/lectures
router.get('/subjects/:subjectId/lectures', (req, res) => {
  try {
    const db = req.app.get('db');
    const items = db.prepare('SELECT * FROM lectures WHERE subject_id = ? ORDER BY sort_order, id').all(req.params.subjectId);
    res.json({ success: true, lectures: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/materials/subjects/:subjectId/lectures
router.post('/subjects/:subjectId/lectures', lectureUpload.single('file'), (req, res) => {
  try {
    const db = req.app.get('db');
    const { title, description, material_date } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Title is required' });

    const filePath = req.file ? req.file.path : '';
    const fileName = req.file ? req.file.originalname : '';
    const fileSize = req.file ? req.file.size : 0;
    const synced = req.user.role === 'owner' ? 1 : 0;

    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM lectures WHERE subject_id = ?').get(req.params.subjectId);

    const result = db.prepare(`
      INSERT INTO lectures (subject_id, title, description, file_path, file_name, file_size, material_date, upload_timestamp, created_by, synced, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)
    `).run(
      req.params.subjectId, title, description || '', filePath, fileName, fileSize,
      material_date || new Date().toISOString().split('T')[0],
      req.user.role, synced, (maxOrder.max || 0) + 1
    );

    const item = db.prepare('SELECT * FROM lectures WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, lecture: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/materials/lectures/:id
router.put('/lectures/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    const { title, description, material_date } = req.body;
    const item = db.prepare('SELECT * FROM lectures WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Lecture not found' });

    db.prepare(`UPDATE lectures SET title = ?, description = ?, material_date = ? WHERE id = ?`).run(
      title || item.title, description !== undefined ? description : item.description,
      material_date || item.material_date, req.params.id
    );

    const updated = db.prepare('SELECT * FROM lectures WHERE id = ?').get(req.params.id);
    res.json({ success: true, lecture: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/materials/lectures/:id
router.delete('/lectures/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    const item = db.prepare('SELECT * FROM lectures WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Lecture not found' });

    deleteFile(item.file_path);
    db.prepare('DELETE FROM lectures WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/materials/lectures/:id/toggle
router.patch('/lectures/:id/toggle', (req, res) => {
  try {
    const db = req.app.get('db');
    const item = db.prepare('SELECT * FROM lectures WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Lecture not found' });

    const newVal = item.completed ? 0 : 1;
    db.prepare('UPDATE lectures SET completed = ? WHERE id = ?').run(newVal, req.params.id);
    res.json({ success: true, completed: newVal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== ASSIGNMENTS ====================

router.get('/subjects/:subjectId/assignments', (req, res) => {
  try {
    const db = req.app.get('db');
    const items = db.prepare('SELECT * FROM assignments WHERE subject_id = ? ORDER BY sort_order, id').all(req.params.subjectId);
    res.json({ success: true, assignments: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/subjects/:subjectId/assignments', assignmentUpload.single('file'), (req, res) => {
  try {
    const db = req.app.get('db');
    const { title, description, due_date, material_date } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Title is required' });

    const filePath = req.file ? req.file.path : '';
    const fileName = req.file ? req.file.originalname : '';
    const synced = req.user.role === 'owner' ? 1 : 0;
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM assignments WHERE subject_id = ?').get(req.params.subjectId);

    const result = db.prepare(`
      INSERT INTO assignments (subject_id, title, description, due_date, file_path, file_name, material_date, upload_timestamp, created_by, synced, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)
    `).run(
      req.params.subjectId, title, description || '', due_date || null, filePath, fileName,
      material_date || new Date().toISOString().split('T')[0],
      req.user.role, synced, (maxOrder.max || 0) + 1
    );

    const item = db.prepare('SELECT * FROM assignments WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, assignment: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/assignments/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    const { title, description, due_date, material_date } = req.body;
    const item = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Assignment not found' });

    db.prepare(`UPDATE assignments SET title = ?, description = ?, due_date = ?, material_date = ? WHERE id = ?`).run(
      title || item.title, description !== undefined ? description : item.description,
      due_date !== undefined ? due_date : item.due_date, material_date || item.material_date, req.params.id
    );

    const updated = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
    res.json({ success: true, assignment: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/assignments/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    const item = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Assignment not found' });

    deleteFile(item.file_path);
    db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/assignments/:id/toggle', (req, res) => {
  try {
    const db = req.app.get('db');
    const item = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Assignment not found' });

    const newVal = item.completed ? 0 : 1;
    db.prepare('UPDATE assignments SET completed = ? WHERE id = ?').run(newVal, req.params.id);
    res.json({ success: true, completed: newVal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== RESOURCES ====================

router.get('/subjects/:subjectId/resources', (req, res) => {
  try {
    const db = req.app.get('db');
    const items = db.prepare('SELECT * FROM resources WHERE subject_id = ? ORDER BY sort_order, id').all(req.params.subjectId);
    res.json({ success: true, resources: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/subjects/:subjectId/resources', (req, res) => {
  try {
    const db = req.app.get('db');
    const { title, description, url, resource_type, material_date } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Title is required' });

    const synced = req.user.role === 'owner' ? 1 : 0;
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM resources WHERE subject_id = ?').get(req.params.subjectId);

    const result = db.prepare(`
      INSERT INTO resources (subject_id, title, description, url, resource_type, material_date, upload_timestamp, created_by, synced, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)
    `).run(
      req.params.subjectId, title, description || '', url || '', resource_type || 'link',
      material_date || new Date().toISOString().split('T')[0],
      req.user.role, synced, (maxOrder.max || 0) + 1
    );

    const item = db.prepare('SELECT * FROM resources WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, resource: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/resources/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    const { title, description, url, resource_type, material_date } = req.body;
    const item = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Resource not found' });

    db.prepare(`UPDATE resources SET title = ?, description = ?, url = ?, resource_type = ?, material_date = ? WHERE id = ?`).run(
      title || item.title, description !== undefined ? description : item.description,
      url !== undefined ? url : item.url, resource_type || item.resource_type,
      material_date || item.material_date, req.params.id
    );

    const updated = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
    res.json({ success: true, resource: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/resources/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    db.prepare('DELETE FROM resources WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/resources/:id/toggle', (req, res) => {
  try {
    const db = req.app.get('db');
    const item = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Resource not found' });

    const newVal = item.completed ? 0 : 1;
    db.prepare('UPDATE resources SET completed = ? WHERE id = ?').run(newVal, req.params.id);
    res.json({ success: true, completed: newVal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== VIDEOS ====================

router.get('/subjects/:subjectId/videos', (req, res) => {
  try {
    const db = req.app.get('db');
    const items = db.prepare('SELECT * FROM videos WHERE subject_id = ? ORDER BY sort_order, id').all(req.params.subjectId);
    res.json({ success: true, videos: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/subjects/:subjectId/videos', videoUpload.single('file'), (req, res) => {
  try {
    const db = req.app.get('db');
    const { title, description, video_url, video_type, duration, material_date } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Title is required' });

    const filePath = req.file ? req.file.path : '';
    const vUrl = video_url || '';
    const vType = req.file ? 'upload' : (video_type || 'youtube');
    const synced = req.user.role === 'owner' ? 1 : 0;
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM videos WHERE subject_id = ?').get(req.params.subjectId);

    const result = db.prepare(`
      INSERT INTO videos (subject_id, title, description, video_url, file_path, video_type, duration, material_date, upload_timestamp, created_by, synced, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)
    `).run(
      req.params.subjectId, title, description || '', vUrl, filePath, vType, duration || '',
      material_date || new Date().toISOString().split('T')[0],
      req.user.role, synced, (maxOrder.max || 0) + 1
    );

    const item = db.prepare('SELECT * FROM videos WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, video: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/videos/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    const { title, description, video_url, video_type, duration, material_date } = req.body;
    const item = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Video not found' });

    db.prepare(`UPDATE videos SET title = ?, description = ?, video_url = ?, video_type = ?, duration = ?, material_date = ? WHERE id = ?`).run(
      title || item.title, description !== undefined ? description : item.description,
      video_url !== undefined ? video_url : item.video_url, video_type || item.video_type,
      duration !== undefined ? duration : item.duration, material_date || item.material_date, req.params.id
    );

    const updated = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
    res.json({ success: true, video: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/videos/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    const item = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Video not found' });

    deleteFile(item.file_path);
    db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/videos/:id/toggle', (req, res) => {
  try {
    const db = req.app.get('db');
    const item = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Video not found' });

    const newVal = item.completed ? 0 : 1;
    db.prepare('UPDATE videos SET completed = ? WHERE id = ?').run(newVal, req.params.id);
    res.json({ success: true, completed: newVal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
