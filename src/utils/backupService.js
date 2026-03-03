const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const execPromise = promisify(exec);

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || './storage/backups';
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate backup filename
function generateBackupFilename(prefix = 'backup') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}_${timestamp}`;
}

// Get database connection details from environment
function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'djoraa',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  };
}

// Create plain SQL backup
async function createBackup(options = {}) {
  const { clinicId, includeAll = false } = options;
  const filename = generateBackupFilename(includeAll ? 'full_backup' : `clinic_${clinicId}`);
  const filepath = path.join(BACKUP_DIR, `${filename}.sql`);
  
  const db = getDbConfig();
  
  let pgDumpCmd = `pg_dump -h ${db.host} -p ${db.port} -U ${db.user}`;
  
  if (!includeAll) {
    // Filter by clinic_id
    pgDumpCmd += ` -t patients -t visits -t prescriptions -t laboratory -t radiology -t appointments -t invoices`;
    pgDumpCmd += ` -t waiting_room -t inventory_items`;
  }
  
  pgDumpCmd += ` -f "${filepath}" ${db.database}`;
  
  try {
    // Set PGPASSWORD environment variable
    const env = { ...process.env, PGPASSWORD: db.password };
    
    await execPromise(pgDumpCmd, { env });
    
    return {
      success: true,
      filename: `${filename}.sql`,
      filepath,
      size: fs.statSync(filepath).size,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Backup failed:', error);
    throw new Error(`Backup failed: ${error.message}`);
  }
}

// Encrypt backup file using AES-256-CBC
async function encryptBackup(inputPath, outputPath = null) {
  if (!ENCRYPTION_KEY) {
    throw new Error('Backup encryption key not configured');
  }
  
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf8');
  const iv = crypto.randomBytes(16);
  
  const input = fs.readFileSync(inputPath);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
  
  // Prepend IV to encrypted data
  const output = Buffer.concat([iv, encrypted]);
  
  const finalPath = outputPath || inputPath.replace('.sql', '.enc.sql');
  fs.writeFileSync(finalPath, output);
  
  return {
    filepath: finalPath,
    size: output.length
  };
}

// Decrypt backup file
async function decryptBackup(inputPath, outputPath = null) {
  if (!ENCRYPTION_KEY) {
    throw new Error('Backup encryption key not configured');
  }
  
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf8');
  
  const input = fs.readFileSync(inputPath);
  const iv = input.slice(0, 16);
  const encrypted = input.slice(16);
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  
  const finalPath = outputPath || inputPath.replace('.enc.sql', '.decrypted.sql');
  fs.writeFileSync(finalPath, decrypted);
  
  return {
    filepath: finalPath,
    size: decrypted.length
  };
}

// Compress backup using gzip
async function compressBackup(inputPath, outputPath = null) {
  const zlib = require('zlib');
  const { pipeline } = require('stream');
  const { promisify } = require('util');
  const pipelineAsync = promisify(pipeline);
  
  const finalPath = outputPath || `${inputPath}.gz`;
  
  const readStream = fs.createReadStream(inputPath);
  const writeStream = fs.createWriteStream(finalPath);
  const gzip = zlib.createGzip();
  
  await pipelineAsync(readStream, gzip, writeStream);
  
  return {
    filepath: finalPath,
    size: fs.statSync(finalPath).size
  };
}

// Decompress backup
async function decompressBackup(inputPath, outputPath = null) {
  const zlib = require('zlib');
  const { pipeline } = require('stream');
  const { promisify } = require('util');
  const pipelineAsync = promisify(pipeline);
  
  const finalPath = outputPath || inputPath.replace('.gz', '');
  
  const readStream = fs.createReadStream(inputPath);
  const writeStream = fs.createWriteStream(finalPath);
  const gunzip = zlib.createGunzip();
  
  await pipelineAsync(readStream, gunzip, writeStream);
  
  return {
    filepath: finalPath,
    size: fs.statSync(finalPath).size
  };
}

// Create encrypted and compressed backup
async function createEncryptedBackup(options = {}) {
  const { clinicId, compress = true } = options;
  
  // Create backup
  const backup = await createBackup({ clinicId });
  
  // Encrypt
  const encrypted = await encryptBackup(backup.filepath);
  
  // Compress if requested
  if (compress) {
    const compressed = await compressBackup(encrypted.filepath);
    
    // Remove unencrypted backup file
    fs.unlinkSync(backup.filepath);
    fs.unlinkSync(encrypted.filepath);
    
    return {
      ...backup,
      filepath: compressed.filepath,
      size: compressed.size,
      encrypted: true,
      compressed: true
    };
  }
  
  return {
    ...backup,
    filepath: encrypted.filepath,
    size: encrypted.size,
    encrypted: true,
    compressed: false
  };
}

// Restore from encrypted backup
async function restoreFromEncryptedBackup(backupPath) {
  // Check file extension
  const isCompressed = backupPath.endsWith('.gz');
  const isEncrypted = backupPath.includes('.enc.');
  
  let workingPath = backupPath;
  
  // Decompress if needed
  if (isCompressed) {
    const decompressed = await decompressBackup(backupPath);
    workingPath = decompressed.filepath;
  }
  
  // Decrypt if needed
  if (isEncrypted) {
    const decrypted = await decryptBackup(workingPath);
    workingPath = decrypted.filepath;
  }
  
  // Restore database
  const db = getDbConfig();
  const restoreCmd = `psql -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} -f "${workingPath}"`;
  
  try {
    const env = { ...process.env, PGPASSWORD: db.password };
    await execPromise(restoreCmd, { env });
    
    return {
      success: true,
      restoredFrom: backupPath
    };
  } catch (error) {
    throw new Error(`Restore failed: ${error.message}`);
  }
}

// List available backups
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return [];
  }
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql') || f.endsWith('.gz') || f.endsWith('.enc.sql'))
    .map(f => {
      const filepath = path.join(BACKUP_DIR, f);
      const stats = fs.statSync(filepath);
      return {
        filename: f,
        filepath,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        encrypted: f.includes('.enc.'),
        compressed: f.endsWith('.gz')
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return files;
}

// Delete old backups (keep last N)
async function cleanupOldBackups(keepCount = 10) {
  const backups = listBackups();
  
  if (backups.length <= keepCount) {
    return { deleted: 0 };
  }
  
  const toDelete = backups.slice(keepCount);
  let deleted = 0;
  
  for (const backup of toDelete) {
    try {
      fs.unlinkSync(backup.filepath);
      deleted++;
    } catch (error) {
      console.error(`Failed to delete ${backup.filename}:`, error);
    }
  }
  
  return { deleted };
}

// Export backup to client (encrypted)
async function exportBackup(backupPath, outputName = null) {
  if (!fs.existsSync(backupPath)) {
    throw new Error('Backup file not found');
  }
  
  const filename = outputName || path.basename(backupPath);
  const data = fs.readFileSync(backupPath);
  
  return {
    filename,
    data,
    size: data.length
  };
}

module.exports = {
  createBackup,
  encryptBackup,
  decryptBackup,
  compressBackup,
  decompressBackup,
  createEncryptedBackup,
  restoreFromEncryptedBackup,
  listBackups,
  cleanupOldBackups,
  exportBackup,
  BACKUP_DIR
};
