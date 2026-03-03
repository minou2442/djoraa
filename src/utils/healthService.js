const db = require('../utils/db');
const fs = require('fs');
const path = require('path');

/**
 * System Health Monitoring Service
 * Provides health checks for the entire system
 */

/**
 * Check database connectivity and response time
 */
async function checkDatabase() {
  const start = Date.now();
  try {
    await db.query('SELECT 1');
    const responseTime = Date.now() - start;
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      connected: true
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      connected: false
    };
  }
}

/**
 * Check disk space for storage directories
 */
function checkDiskSpace() {
  try {
    // Check storage directory
    const storagePath = process.env.STORAGE_PATH || path.join(__dirname, '../../storage');
    
    // For Windows, use wmic; for Unix, use df
    // This is a simplified check
    let total = 0;
    let free = 0;
    
    if (fs.existsSync(storagePath)) {
      const stats = fs.statfsSync ? fs.statfsSync(storagePath) : null;
      if (stats) {
        total = stats.bsize * stats.blocks;
        free = stats.bsize * stats.bfree;
      }
    }
    
    return {
      status: 'healthy',
      storagePath,
      total: formatBytes(total),
      free: formatBytes(free),
      used: formatBytes(total - free),
      percentage: total > 0 ? ((total - free) / total * 100).toFixed(2) + '%' : 'N/A'
    };
  } catch (error) {
    return {
      status: 'unknown',
      error: error.message
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory() {
  const usage = process.memoryUsage();
  return {
    status: 'healthy',
    heapUsed: formatBytes(usage.heapUsed),
    heapTotal: formatBytes(usage.heapTotal),
    external: formatBytes(usage.external),
    rss: formatBytes(usage.rss),
    percentage: (usage.heapUsed / usage.heapTotal * 100).toFixed(2) + '%'
  };
}

/**
 * Check CPU usage (simplified)
 */
function checkCPU() {
  const cpuUsage = process.cpuUsage();
  return {
    status: 'healthy',
    user: cpuUsage.user / 1000000 + 's',
    system: cpuUsage.system / 1000000 + 's'
  };
}

/**
 * Check backup directory status
 */
function checkBackups() {
  try {
    const backupPath = process.env.BACKUP_DIR || path.join(__dirname, '../../storage/backups');
    
    if (!fs.existsSync(backupPath)) {
      return {
        status: 'warning',
        message: 'Backup directory does not exist',
        path: backupPath
      };
    }
    
    const files = fs.readdirSync(backupPath);
    const backupFiles = files.filter(f => f.endsWith('.sql') || f.endsWith('.dump'));
    
    // Get the most recent backup
    let lastBackup = null;
    if (backupFiles.length > 0) {
      const sortedFiles = backupFiles.map(f => ({
        name: f,
        time: fs.statSync(path.join(backupPath, f)).mtime
      })).sort((a, b) => b.time - a.time);
      lastBackup = sortedFiles[0].time.toISOString();
    }
    
    return {
      status: 'healthy',
      path: backupPath,
      totalBackups: backupFiles.length,
      lastBackup,
      lastBackupAge: lastBackup ? getDaysSince(lastBackup) : null
    };
  } catch (error) {
    return {
      status: 'unknown',
      error: error.message
    };
  }
}

/**
 * Get system uptime
 */
function checkUptime() {
  const uptime = process.uptime();
  return {
    status: 'healthy',
    uptime: formatUptime(uptime),
    seconds: Math.floor(uptime)
  };
}

/**
 * Get complete system health status
 */
async function getSystemHealth() {
  const [
    database,
    diskSpace,
    memory,
    cpu,
    backups,
    uptime
  ] = await Promise.all([
    checkDatabase().catch(e => ({ status: 'error', error: e.message })),
    Promise.resolve(checkDiskSpace()),
    Promise.resolve(checkMemory()),
    Promise.resolve(checkCPU()),
    Promise.resolve(checkBackups()),
    Promise.resolve(checkUptime())
  ]);
  
  // Determine overall status
  let overallStatus = 'healthy';
  if (database.status === 'unhealthy') overallStatus = 'critical';
  else if (diskSpace.status === 'unhealthy' || memory.percentage > '90%') overallStatus = 'warning';
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks: {
      database,
      diskSpace,
      memory,
      cpu,
      backups,
      uptime
    }
  };
}

/**
 * Get clinic-specific health (for multi-clinic)
 */
async function getClinicHealth(clinic_id) {
  try {
    // Get clinic user count
    const userCount = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE clinic_id = $1',
      [clinic_id]
    );
    
    // Get clinic file count
    const fileCount = await db.query(
      'SELECT COUNT(*) as count FROM file_logs WHERE clinic_id = $1',
      [clinic_id]
    );
    
    // Get recent audit logs
    const recentActivity = await db.query(
      `SELECT COUNT(*) as count FROM audit_logs 
       WHERE clinic_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'`,
      [clinic_id]
    );
    
    return {
      clinic_id,
      users: parseInt(userCount.rows[0].count),
      files: parseInt(fileCount.rows[0].count),
      recentActivity: parseInt(recentActivity.rows[0].count),
      status: 'healthy'
    };
  } catch (error) {
    return {
      clinic_id,
      status: 'error',
      error: error.message
    };
  }
}

// Helper functions
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

function getDaysSince(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now - date) / (1000 * 60 * 60 * 24));
}

module.exports = {
  getSystemHealth,
  getClinicHealth,
  checkDatabase,
  checkDiskSpace,
  checkMemory,
  checkCPU,
  checkBackups,
  checkUptime
};
