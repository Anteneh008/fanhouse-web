/**
 * Initialize likes and comments schema
 * Run this script to create post_likes and post_comments tables
 * 
 * Usage: node scripts/init-likes-comments.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initLikesComments() {
  try {
    console.log('🔄 Connecting to database...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const schemaPath = path.join(__dirname, '..', 'lib', 'db-schema-likes-comments.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    console.log('📄 Running db-schema-likes-comments.sql...');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    console.log('✅ db-schema-likes-comments.sql executed successfully!');
    
    console.log('\n🎉 Likes and comments tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initLikesComments();

