/**
 * Initialize all database schemas
 * Run this script to create all tables in your PostgreSQL database
 * 
 * Usage: node scripts/init-all-schemas.js
 * 
 * Environment: Set DATABASE_URL in .env.local or as environment variable
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const schemaFiles = [
  'db-schema.sql',
  'db-schema-messaging.sql',
  'db-schema-payouts.sql',
];

async function initAllSchemas() {
  try {
    console.log('🔄 Connecting to database...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    for (const schemaFile of schemaFiles) {
      const schemaPath = path.join(__dirname, '..', 'lib', schemaFile);
      
      if (!fs.existsSync(schemaPath)) {
        console.warn(`⚠️  Schema file not found: ${schemaFile}, skipping...`);
        continue;
      }
      
      console.log(`📄 Running ${schemaFile}...`);
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Execute the schema
      await pool.query(schema);
      console.log(`✅ ${schemaFile} executed successfully!`);
    }
    
    console.log('\n🎉 All database schemas initialized successfully!');
    console.log('📊 Your database is ready for use.');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initAllSchemas();

