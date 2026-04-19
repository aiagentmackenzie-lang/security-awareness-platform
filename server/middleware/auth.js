/**
 * Security Awareness Platform - Authentication Middleware
 * JWT verification and role-based access control
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production-64-characters-long';

/**
 * Verify JWT token middleware
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token required'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token type'
        }
      });
    }

    // Attach full user object (compatible with routes that use req.user)
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'learner'
    };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid or expired token'
      }
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token present, but doesn't require it
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type === 'access') {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role || 'learner'
        };
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
      }
    } catch (error) {
      // Invalid token, continue without user
    }
  }

  next();
}

/**
 * Role-based access control middleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const userRole = req.user?.role || 'learner';
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
}

/**
 * Admin-only middleware
 */
const requireAdmin = requireRole('admin');

/**
 * Manager or Admin middleware
 */
const requireManager = requireRole('manager', 'admin');

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireManager
};