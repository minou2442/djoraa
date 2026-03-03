const { 
  checkRateLimit, 
  getClientIP, 
  getSecurityHeaders,
  isSessionExpired,
  destroySession
} = require('../utils/security');

// Rate limiting middleware
const rateLimiter = (maxAttempts = 10, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const key = getClientIP(req);
    const result = checkRateLimit(key, maxAttempts, windowMs);
    
    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        waitTime: result.waitTime
      });
    }
    
    res.setHeader('X-RateLimit-Limit', maxAttempts);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    
    next();
  };
};

// API key authentication for integrations
const requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Validate API key (would check against database in production)
  // For now, simple check
  if (apiKey.length < 32) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};

// Session validation middleware
const validateSession = (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Session required' });
  }
  
  const session = req.app.locals.sessions?.get(sessionId);
  
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  
  if (isSessionExpired(session)) {
    destroySession(sessionId);
    return res.status(401).json({ error: 'Session expired due to inactivity' });
  }
  
  req.session = session;
  next();
};

// Auto-logout middleware
const autoLogout = (idleTimeout = 15 * 60 * 1000) => {
  return (req, res, next) => {
    if (req.session && isSessionExpired(req.session, idleTimeout)) {
      destroySession(req.session.id);
      return res.status(440).json({ error: 'Session timeout - please login again' });
    }
    next();
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potential XSS vectors
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  
  next();
};

// Request size limit
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || 0);
    const maxBytes = maxSize === '10mb' ? 10 * 1024 * 1024 : 
                     maxSize === '5mb' ? 5 * 1024 * 1024 : 
                     parseInt(maxSize);
    
    if (contentLength > maxBytes) {
      return res.status(413).json({ error: 'Payload too large' });
    }
    
    next();
  };
};

// CSRF protection token generation
const csrfTokens = new Map();

const generateCSRFToken = (sessionId) => {
  const token = require('crypto').randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, {
    token,
    createdAt: Date.now()
  });
  return token;
};

const validateCSRFToken = (req, res, next) => {
  // Skip for GET requests
  if (req.method === 'GET') {
    return next();
  }
  
  const sessionId = req.headers['x-session-id'];
  const token = req.headers['x-csrf-token'];
  
  if (!sessionId || !token) {
    return res.status(403).json({ error: 'CSRF token required' });
  }
  
  const stored = csrfTokens.get(sessionId);
  
  if (!stored || stored.token !== token) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  // Check token expiry (1 hour)
  if (Date.now() - stored.createdAt > 60 * 60 * 1000) {
    csrfTokens.delete(sessionId);
    return res.status(403).json({ error: 'CSRF token expired' });
  }
  
  next();
};

// IP whitelist check
const ipWhitelist = process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [];

const checkIPWhitelist = (req, res, next) => {
  if (ipWhitelist.length === 0) {
    return next(); // No whitelist configured
  }
  
  const clientIP = getClientIP(req);
  
  if (ipWhitelist.includes(clientIP)) {
    return next();
  }
  
  return res.status(403).json({ error: 'IP not allowed' });
};

module.exports = {
  rateLimiter,
  requireApiKey,
  validateSession,
  autoLogout,
  securityHeaders,
  sanitizeInput,
  requestSizeLimit,
  generateCSRFToken,
  validateCSRFToken,
  checkIPWhitelist
};
