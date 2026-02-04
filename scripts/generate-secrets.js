#!/usr/bin/env node

/**
 * Generate required secrets for Growth OS
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Growth OS - Secret Generator\n');
console.log('='.repeat(50));
console.log('\nCopy these values to your Vercel environment variables:\n');

// Generate encryption key (32 bytes, base64)
const encryptionKey = crypto.randomBytes(32).toString('base64');
console.log('ENCRYPTION_KEY=' + encryptionKey);

// Generate cron secret (32 bytes, hex)
const cronSecret = crypto.randomBytes(32).toString('hex');
console.log('CRON_SECRET=' + cronSecret);

console.log('\n' + '='.repeat(50));
console.log('\n✅ Secrets generated!');
console.log('\nNext steps:');
console.log('1. Copy ENCRYPTION_KEY to Vercel environment variables');
console.log('2. Copy CRON_SECRET to Vercel environment variables');
console.log('3. Make sure to set them for Production, Preview, and Development environments\n');
