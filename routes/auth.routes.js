/**
 * Authentication Routes
 * Login, user management, assistant accounts
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, requireOwner } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const db = req.app.get('db');
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.active) {
      return res.status(403).json({ success: false, error: 'Account is disabled' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, role: user.role, display_name: user.display_name }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    const db = req.app.get('db');
    const user = db.prepare('SELECT id, username, role, display_name, active, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/assistant — Create assistant account (owner only)
router.post('/assistant', authenticateToken, requireOwner, (req, res) => {
  try {
    const { username, password, display_name } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const db = req.app.get('db');
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)'
    ).run(username, hash, 'assistant', display_name || username);

    const user = db.prepare('SELECT id, username, role, display_name, active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/assistants — List all assistants (owner only)
router.get('/assistants', authenticateToken, requireOwner, (req, res) => {
  try {
    const db = req.app.get('db');
    const assistants = db.prepare('SELECT id, username, role, display_name, active, created_at FROM users WHERE role = ?').all('assistant');
    res.json({ success: true, assistants });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/auth/assistant/:id — Update assistant (owner only)
router.put('/assistant/:id', authenticateToken, requireOwner, (req, res) => {
  try {
    const db = req.app.get('db');
    const { password, display_name, active } = req.body;
    const assistant = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(req.params.id, 'assistant');

    if (!assistant) {
      return res.status(404).json({ success: false, error: 'Assistant not found' });
    }

    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?').run(hash, req.params.id);
    }
    if (display_name !== undefined) {
      db.prepare('UPDATE users SET display_name = ?, updated_at = datetime("now") WHERE id = ?').run(display_name, req.params.id);
    }
    if (active !== undefined) {
      db.prepare('UPDATE users SET active = ?, updated_at = datetime("now") WHERE id = ?').run(active ? 1 : 0, req.params.id);
    }

    const updated = db.prepare('SELECT id, username, role, display_name, active, created_at, updated_at FROM users WHERE id = ?').get(req.params.id);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/auth/assistant/:id
router.delete('/assistant/:id', authenticateToken, requireOwner, (req, res) => {
  try {
    const db = req.app.get('db');
    const assistant = db.prepare('SELECT id FROM users WHERE id = ? AND role = ?').get(req.params.id, 'assistant');
    if (!assistant) return res.status(404).json({ success: false, error: 'Assistant not found' });

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticateToken, (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, error: 'Current and new password required' });
    }

    const db = req.app.get('db');
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(current_password, user.password_hash)) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?').run(hash, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
