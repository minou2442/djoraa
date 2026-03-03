const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../storage/uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];

// ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * generates a secure filename with timestamp and hash
 */
function generateSecureFilename(originalFilename, userId) {
  const ext = path.extname(originalFilename);
  const name = path.basename(originalFilename, ext);
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString('hex');
  return `${userId}_${timestamp}_${hash}${ext}`;
}

/**
 * validates file before storage
 */
function validateFile(file, userId) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE} bytes` };
  }

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return { valid: false, error: `File type ${file.mimetype} not allowed` };
  }

  return { valid: true };
}

/**
 * saves uploaded file securely
 */
async function saveFile(file, userId, clinicId) {
  const validation = validateFile(file, userId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const secureFilename = generateSecureFilename(file.originalname, userId);
  const clinicDir = path.join(UPLOAD_DIR, `clinic_${clinicId}`);

  // ensure clinic directory exists
  if (!fs.existsSync(clinicDir)) {
    fs.mkdirSync(clinicDir, { recursive: true });
  }

  const filepath = path.join(clinicDir, secureFilename);

  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, file.buffer, (err) => {
      if (err) return reject(err);
      resolve({
        filename: secureFilename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        uploadedBy: userId,
        clinicId: clinicId,
        uploadedAt: new Date(),
        storagePath: filepath
      });
    });
  });
}

/**
 * retrieves file for download
 */
function getFile(filename, userId, clinicId) {
  const clinicDir = path.join(UPLOAD_DIR, `clinic_${clinicId}`);
  const filepath = path.join(clinicDir, filename);

  // security: prevent directory traversal
  const normalizedPath = path.normalize(filepath);
  if (!normalizedPath.startsWith(clinicDir)) {
    throw new Error('Invalid file path');
  }

  if (!fs.existsSync(filepath)) {
    throw new Error('File not found');
  }

  return {
    path: filepath,
    filename: filename
  };
}

/**
 * deletes file securely
 */
function deleteFile(filename, clinicId) {
  const clinicDir = path.join(UPLOAD_DIR, `clinic_${clinicId}`);
  const filepath = path.join(clinicDir, filename);

  // security: prevent directory traversal
  const normalizedPath = path.normalize(filepath);
  if (!normalizedPath.startsWith(clinicDir)) {
    throw new Error('Invalid file path');
  }

  if (!fs.existsSync(filepath)) {
    throw new Error('File not found');
  }

  return new Promise((resolve, reject) => {
    fs.unlink(filepath, (err) => {
      if (err) return reject(err);
      resolve({ message: 'File deleted successfully' });
    });
  });
}

/**
 * lists files for a clinic
 */
function listFiles(clinicId) {
  const clinicDir = path.join(UPLOAD_DIR, `clinic_${clinicId}`);

  if (!fs.existsSync(clinicDir)) {
    return [];
  }

  return new Promise((resolve, reject) => {
    fs.readdir(clinicDir, { withFileTypes: true }, (err, files) => {
      if (err) return reject(err);

      const fileList = files
        .filter(f => f.isFile())
        .map(f => {
          const filepath = path.join(clinicDir, f.name);
          const stats = fs.statSync(filepath);
          return {
            filename: f.name,
            size: stats.size,
            uploadedAt: stats.birthtime,
            modifiedAt: stats.mtime
          };
        });

      resolve(fileList);
    });
  });
}

module.exports = {
  saveFile,
  getFile,
  deleteFile,
  listFiles,
  validateFile,
  generateSecureFilename
};
