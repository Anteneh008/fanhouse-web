/**
 * Initialize live streams database schema
 * 
 * Usage: node scripts/init-livestreams.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initLivestreams() {
  try {
    console.log('🔄 Connecting to database...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const schemaPath = path.join(__dirname, '..', 'lib', 'db-schema-livestreams.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    console.log('📄 Running db-schema-livestreams.sql...');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    console.log('✅ Live streams schema initialized successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing schema:', error.message);
    if (error.code === '42710') {
      console.log('ℹ️  Some objects already exist, continuing...');
    } else {
      console.error(error);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

initLivestreams();

