/**
 * Initialize notifications schema
 * Run this script to create the notifications and notification_preferences tables
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function initNotifications() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read and execute the notifications schema SQL
    const schemaPath = path.join(__dirname, '..', 'lib', 'db-schema-notifications.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('Creating notifications tables...');
    await client.query(schemaSQL);
    console.log('✅ Notifications schema created successfully!');

    console.log('\nTables created:');
    console.log('  - notification_preferences');
    console.log('  - notifications');
    console.log('\nFunctions created:');
    console.log('  - get_unread_notification_count()');
    console.log('  - mark_notifications_read()');
  } catch (error) {
    console.error('Error initializing notifications schema:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initNotifications();

