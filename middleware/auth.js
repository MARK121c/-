/**
 * JWT Authentication Middleware
 * Provides token verification and role-based access control
 */

const jwt = require('jsonwebtoken');

// Verify JWT token from Authorization header or cookie
function authenticateToken(req, res, next) {
  let token = null;

  // Check Authorization header first
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Fallback to cookie
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, c) => {
      const [key, val] = c.trim().split('=');
      acc[key] = val;
      return acc;
    }, {});
    token = cookies['academic_token'];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

// Require owner role
function requireOwner(req, res, next) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ success: false, error: 'Owner access required' });
  }
  next();
}

// Allow any authenticated role (owner or assistant)
function requireAnyRole(req, res, next) {
  if (!req.user || !['owner', 'assistant'].includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  next();
}

module.exports = { authenticateToken, requireOwner, requireAnyRole };
