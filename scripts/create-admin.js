/**
 * Script to create an admin user
 * Run this script to create an admin account
 * 
 * Usage: node scripts/create-admin.js email@example.com password123
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const SALT_ROUNDS = 10;

async function createAdmin(email, password) {
  try {
    console.log('🔄 Creating admin user...');
    
    // Validate input
    if (!email || !password) {
      console.error('❌ Usage: node scripts/create-admin.js email@example.com password123');
      process.exit(1);
    }
    
    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      process.exit(1);
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Check if user already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existing.rows.length > 0) {
      console.log('⚠️  User already exists. Updating to admin role...');
      await pool.query(
        'UPDATE users SET role = $1 WHERE email = $2',
        ['admin', email.toLowerCase()]
      );
      console.log('✅ User updated to admin role!');
    } else {
      // Create new admin user
      await pool.query(
        `INSERT INTO users (email, password_hash, role, creator_status)
         VALUES ($1, $2, $3, $4)`,
        [email.toLowerCase(), passwordHash, 'admin', null]
      );
      console.log('✅ Admin user created successfully!');
    }
    
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Role: admin`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const email = process.argv[2];
const password = process.argv[3];

createAdmin(email, password);

