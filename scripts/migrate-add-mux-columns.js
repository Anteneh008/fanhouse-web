/**
 * Migration: Add Mux columns to live_streams table
 * 
 * This script adds rtmp_url and mux_stream_id columns to the live_streams table
 * for Mux integration support.
 * 
 * Usage: node scripts/migrate-add-mux-columns.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('🔄 Connecting to database...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Check if columns already exist
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'live_streams' 
      AND column_name IN ('rtmp_url', 'mux_stream_id')
    `);

    const existingColumns = checkResult.rows.map(row => row.column_name);

    // Add rtmp_url column if it doesn't exist
    if (!existingColumns.includes('rtmp_url')) {
      console.log('📄 Adding rtmp_url column...');
      await pool.query(`
        ALTER TABLE live_streams 
        ADD COLUMN rtmp_url TEXT
      `);
      console.log('✅ rtmp_url column added successfully!');
    } else {
      console.log('ℹ️  rtmp_url column already exists, skipping...');
    }

    // Add mux_stream_id column if it doesn't exist
    if (!existingColumns.includes('mux_stream_id')) {
      console.log('📄 Adding mux_stream_id column...');
      await pool.query(`
        ALTER TABLE live_streams 
        ADD COLUMN mux_stream_id VARCHAR(255)
      `);
      console.log('✅ mux_stream_id column added successfully!');
    } else {
      console.log('ℹ️  mux_stream_id column already exists, skipping...');
    }

    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

