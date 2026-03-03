const bcrypt = require('bcrypt');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Password hashing
const SALT_ROUNDS = 12;

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// AES-256 encryption for sensitive data
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return null;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  if (!text) return null;
  
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Encrypt object fields
function encryptFields(obj, fields) {
  const encrypted = { ...obj };
  fields.forEach(field => {
    if (encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field]);
    }
  });
  return encrypted;
}

// Decrypt object fields
function decryptFields(obj, fields) {
  const decrypted = { ...obj };
  fields.forEach(field => {
    if (decrypted[field]) {
      decrypted[field] = decrypt(decrypted[field]);
    }
  });
  return decrypted;
}

// Two-Factor Authentication
async function generateTOTPSecret(user) {
  const secret = speakeasy.generateSecret({
    name: `DJORAA (${user.email})`,
    issuer: 'DJORAA Medical ERP'
  });
  
  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url
  };
}

async function generateQRCode(otpauthUrl) {
  return await QRCode.toDataURL(otpauthUrl);
}

function verifyTOTP(token, secret) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1 // Allow 1 step tolerance
  });
}

// Generate secure random token
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Generate numeric code (for SMS)
function generateNumericCode(length = 6) {
  return crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, '0');
}

// Hash token for storage
async function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Password strength validator
function validatePasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  return {
    valid: score >= 4,
    score,
    checks,
    suggestions: [
      !checks.length && 'Use at least 8 characters',
      !checks.uppercase && 'Add uppercase letters',
      !checks.lowercase && 'Add lowercase letters',
      !checks.number && 'Add numbers',
      !checks.special && 'Add special characters'
    ].filter(Boolean)
  };
}

// Rate limiting helper
const rateLimitStore = new Map();

function checkRateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record) {
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now, lastAttempt: now });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  // Reset if window expired
  if (now - record.firstAttempt > windowMs) {
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now, lastAttempt: now });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  // Check if max attempts reached
  if (record.attempts >= maxAttempts) {
    const waitTime = Math.ceil((record.firstAttempt + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, waitTime };
  }
  
  // Increment attempts
  record.attempts++;
  record.lastAttempt = now;
  rateLimitStore.set(key, record);
  
  return { allowed: true, remaining: maxAttempts - record.attempts };
}

// Session management
const sessions = new Map();

function createSession(userId, sessionData = {}) {
  const sessionId = generateSecureToken();
  const session = {
    id: sessionId,
    userId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    expiresAt: Date.now() + (process.env.SESSION_TIMEOUT || 30) * 60 * 1000, // Default 30 min
    ...sessionData
  };
  
  sessions.set(sessionId, session);
  return session;
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  
  if (!session) return null;
  
  // Check expiration
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  
  // Update last activity
  session.lastActivity = Date.now();
  sessions.set(sessionId, session);
  
  return session;
}

function destroySession(sessionId) {
  return sessions.delete(sessionId);
}

function destroyUserSessions(userId) {
  let count = 0;
  for (const [id, session] of sessions) {
    if (session.userId === userId) {
      sessions.delete(id);
      count++;
    }
  }
  return count;
}

// Auto-logout check
function isSessionExpired(session, idleTimeout = 15 * 60 * 1000) {
  const idleTime = Date.now() - session.lastActivity;
  return idleTime > idleTimeout;
}

// IP validation
function isValidIP(ip) {
  // IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 validation
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() 
    || req.headers['x-real-ip'] 
    || req.connection?.remoteAddress 
    || req.socket?.remoteAddress 
    || 'unknown';
}

// Security headers
function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
}

module.exports = {
  // Password
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  
  // Encryption
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  ENCRYPTION_KEY,
  
  // TOTP
  generateTOTPSecret,
  generateQRCode,
  verifyTOTP,
  
  // Tokens
  generateSecureToken,
  generateNumericCode,
  hashToken,
  
  // Rate limiting
  checkRateLimit,
  
  // Sessions
  createSession,
  getSession,
  destroySession,
  destroyUserSessions,
  isSessionExpired,
  
  // IP
  isValidIP,
  getClientIP,
  
  // Headers
  getSecurityHeaders
};
