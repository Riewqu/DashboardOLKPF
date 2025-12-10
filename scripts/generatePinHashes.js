/**
 * Generate bcrypt hashes for PIN codes
 * Run this script to generate secure PIN hashes for user accounts
 *
 * Usage: node scripts/generatePinHashes.js
 */

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

async function generateHash(pin, label) {
  try {
    const hash = await bcrypt.hash(pin, SALT_ROUNDS);
    console.log(`\n${label}:`);
    console.log(`  PIN: ${pin}`);
    console.log(`  Hash: ${hash}`);
    console.log(`\n  SQL Update:`);
    console.log(`  UPDATE user_accounts SET pin_hash = '${hash}' WHERE username = '${label.toLowerCase()}';`);
    return hash;
  } catch (error) {
    console.error(`Error generating hash for ${label}:`, error);
    return null;
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔐 PIN Hash Generator');
  console.log('='.repeat(70));

  await generateHash('111111', 'admin');
  await generateHash('999999', 'viewer');

  console.log('\n' + '='.repeat(70));
  console.log('✅ Done! Copy the SQL statements above and run them in Supabase SQL Editor');
  console.log('='.repeat(70));
  console.log('\n⚠️  Keep these PINs secret!');
  console.log('💡 You can change PINs later through the Admin Panel\n');
}

main();
