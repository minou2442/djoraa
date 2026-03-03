const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../utils/db');
const fileService = require('../utils/fileService');
const pdfService = require('../utils/pdfService');
const { requireRole } = require('../middleware/roles');

// multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // store in memory for validation
  limits: { fileSize: 52428800 } // 50MB limit
});

/**
 * upload file
 * POST /api/files/upload
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { clinic_id, user_id } = req.body;
    const file = req.file;

    if (!clinic_id || !user_id) {
      return res.status(400).json({ message: 'clinic_id and user_id required' });
    }

    // validate user has access to clinic
    if (req.user.clinic_id !== parseInt(clinic_id) && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Cannot upload to clinic' });
    }

    // save file
    const savedFile = await fileService.saveFile(file, user_id, clinic_id);

    // log to database (optional)
    await db.query(
      `INSERT INTO file_logs (clinic_id, user_id, filename, original_name, size, file_type, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [clinic_id, user_id, savedFile.filename, savedFile.originalName, savedFile.size, savedFile.mimetype]
    );

    res.status(201).json(savedFile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * download file
 * GET /api/files/download/:filename
 */
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const clinic_id = req.clinic_id;
    const user_id = req.user.id;

    // get file
    const file = fileService.getFile(filename, user_id, clinic_id);

    // send file
    res.download(file.path, file.filename, (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'Download failed' });
      }

      // log download
      db.query(
        `INSERT INTO file_logs (clinic_id, user_id, filename, action, accessed_at)
         VALUES ($1, $2, $3, 'download', NOW())`,
        [clinic_id, user_id, filename]
      ).catch(console.error);
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * list clinic files
 * GET /api/files/list
 */
router.get('/list', async (req, res) => {
  try {
    const clinic_id = req.clinic_id;

    const files = await fileService.listFiles(clinic_id);
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * delete file
 * DELETE /api/files/:filename
 */
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const clinic_id = req.clinic_id;

    await fileService.deleteFile(filename, clinic_id);

    // log deletion
    await db.query(
      `INSERT INTO file_logs (clinic_id, user_id, filename, action, accessed_at)
       VALUES ($1, $2, $3, 'delete', NOW())`,
      [clinic_id, req.user.id, filename]
    );

    res.json({ message: 'File deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * generate PDF
 * POST /api/files/generate-pdf
 */
router.post('/generate-pdf', async (req, res) => {
  try {
    const { template, data, filename } = req.body;
    const clinic_id = req.clinic_id;

    if (!template || !data) {
      return res.status(400).json({ message: 'template and data required' });
    }

    const pdfBuffer = await pdfService.generatePDFBuffer(template, data);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename || 'document.pdf'}`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * backup database
 * POST /api/files/backup
 * requires admin role
 */
router.post('/backup', requireRole('superadmin', 'clinic_admin'), async (req, res) => {
  try {
    const backupService = require('../utils/backupService');
    const clinic_id = req.query.clinic_id || null;

    // clinic_admin can only backup their own clinic
    if (req.user.role === 'clinic_admin' && clinic_id && req.user.clinic_id !== parseInt(clinic_id)) {
      return res.status(403).json({ message: 'Cannot backup other clinics' });
    }

    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'djoraa'
    };

    const backup = await backupService.backupDatabase(dbConfig, clinic_id);
    res.json(backup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * list backups
 * GET /api/files/backups
 * requires admin role
 */
router.get('/backups', requireRole('superadmin', 'clinic_admin'), async (req, res) => {
  try {
    const backupService = require('../utils/backupService');
    const clinic_id = req.query.clinic_id || null;

    // clinic_admin can only see their own clinic backups
    if (req.user.role === 'clinic_admin' && clinic_id && req.user.clinic_id !== parseInt(clinic_id)) {
      return res.status(403).json({ message: 'Cannot access other clinic backups' });
    }

    const backups = backupService.listBackups(clinic_id);
    res.json(backups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * restore database from backup
 * POST /api/files/restore
 * requires superadmin role
 */
router.post('/restore', requireRole('superadmin'), async (req, res) => {
  try {
    const backupService = require('../utils/backupService');
    const { backupFile } = req.body;

    if (!backupFile) {
      return res.status(400).json({ message: 'backupFile required' });
    }

    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'djoraa'
    };

    const backupPath = require('path').join(
      process.env.BACKUP_DIR || require('path').join(__dirname, '../../storage/backups'),
      backupFile
    );

    const result = await backupService.restoreDatabase(backupPath, dbConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
