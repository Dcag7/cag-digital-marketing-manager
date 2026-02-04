#!/usr/bin/env node

/**
 * Helper script to run database migrations
 * Usage: node scripts/run-migration.js <direct-url>
 * 
 * Or set DATABASE_URL environment variable:
 * DATABASE_URL="postgresql://..." node scripts/run-migration.js
 */

const { execSync } = require('child_process');

const directUrl = process.argv[2] || process.env.DATABASE_URL;

if (!directUrl) {
  console.error('\n❌ Error: No database URL provided\n');
  console.log('Usage:');
  console.log('  node scripts/run-migration.js <direct-url>');
  console.log('  OR');
  console.log('  DATABASE_URL="postgresql://..." node scripts/run-migration.js\n');
  process.exit(1);
}

console.log('\n🔄 Running database migrations...\n');
console.log('Using DIRECT_URL:', directUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
console.log('');

try {
  // Set DATABASE_URL for the migration
  process.env.DATABASE_URL = directUrl;
  
  // Run Prisma migrate
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: directUrl,
    },
  });
  
  console.log('\n✅ Migrations completed successfully!\n');
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Verify your DIRECT_URL is correct (no pgbouncer)');
  console.log('2. Check that your Neon database is active');
  console.log('3. Ensure you have network access to Neon\n');
  process.exit(1);
}
