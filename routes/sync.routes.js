/**
 * Sync Routes
 * Handle content synchronization between assistant and owner
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireAnyRole } = require('../middleware/auth');

router.use(authenticateToken);

// POST /api/sync/sync — Sync all pending content
router.post('/sync', requireAnyRole, (req, res) => {
  try {
    const db = req.app.get('db');
    const tables = ['lectures', 'assignments', 'resources', 'videos'];
    let totalSynced = 0;

    tables.forEach(table => {
      const result = db.prepare(`UPDATE ${table} SET synced = 1 WHERE synced = 0`).run();
      totalSynced += result.changes;
    });

    db.prepare('INSERT INTO sync_log (synced_by, items_synced, synced_at) VALUES (?, ?, datetime("now"))').run(req.user.id, totalSynced);

    res.json({ success: true, items_synced: totalSynced });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sync/pending — Count unsynced items
router.get('/pending', (req, res) => {
  try {
    const db = req.app.get('db');
    const lec = db.prepare('SELECT COUNT(*) as c FROM lectures WHERE synced = 0').get().c;
    const asgn = db.prepare('SELECT COUNT(*) as c FROM assignments WHERE synced = 0').get().c;
    const rsrc = db.prepare('SELECT COUNT(*) as c FROM resources WHERE synced = 0').get().c;
    const vid = db.prepare('SELECT COUNT(*) as c FROM videos WHERE synced = 0').get().c;

    res.json({
      success: true,
      pending: { lectures: lec, assignments: asgn, resources: rsrc, videos: vid, total: lec + asgn + rsrc + vid }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sync/log — Get sync history
router.get('/log', (req, res) => {
  try {
    const db = req.app.get('db');
    const logs = db.prepare(`
      SELECT s.*, u.username, u.display_name 
      FROM sync_log s LEFT JOIN users u ON s.synced_by = u.id 
      ORDER BY s.synced_at DESC LIMIT 50
    `).all();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
