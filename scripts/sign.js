#!/usr/bin/env node
/**
 * Electron Builder Code Signing Script
 * Handles signing of Electron app for Windows
 * 
 * Environment variables:
 * - CSC_LINK: Path to .pfx certificate file
 * - CSC_KEY_PASSWORD: Certificate password
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const certificateLink = process.env.CSC_LINK;
const certificatePassword = process.env.CSC_KEY_PASSWORD;

if (!certificateLink || !certificatePassword) {
  console.log('⚠️  Code signing skipped: CSC_LINK or CSC_KEY_PASSWORD not set');
  process.exit(0);
}

if (!fs.existsSync(certificateLink)) {
  console.error(`❌ Certificate not found: ${certificateLink}`);
  process.exit(1);
}

console.log('✅ Code signing enabled');
console.log(`📝 Certificate: ${certificateLink}`);

// electron-builder will automatically use CSC_LINK and CSC_KEY_PASSWORD
// This script just validates the setup
process.exit(0);
