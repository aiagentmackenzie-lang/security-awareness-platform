/**
 * Database Migration Script
 * Security Awareness Platform
 * 
 * Usage: node db/migrate.js
 * 
 * Creates all tables from schema.sql and tracks migrations.
 */

const fs = require('fs');
const path = require('path');
const { pool, query } = require('./pool.js');

const MIGRATIONS_TABLE = 'migrations';

/**
 * Create migrations tracking table
 */
async function createMigrationsTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await query(createTableSQL);
  console.log('✅ Migrations table ready');
}

/**
 * Get list of already executed migrations
 */
async function getExecutedMigrations() {
  const result = await query(`SELECT filename FROM ${MIGRATIONS_TABLE}`);
  return new Set(result.rows.map(r => r.filename));
}

/**
 * Run a migration file
 */
async function runMigration(filename, sql) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Execute the migration SQL
    await client.query(sql);
    
    // Record the migration
    await client.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1)`,
      [filename]
    );
    
    await client.query('COMMIT');
    console.log(`✅ Migration executed: ${filename}`);
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration failed: ${filename}`);
    console.error(err.message);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Run the main schema.sql file
 */
async function runSchemaMigration() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Schema file not found: ${schemaPath}`);
    return false;
  }
  
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  const filename = 'schema.sql';
  
  const executed = await getExecutedMigrations();
  
  if (executed.has(filename)) {
    console.log('⏩ Schema migration already executed, skipping...');
    return true;
  }
  
  return await runMigration(filename, schemaSQL);
}

/**
 * Main migration runner
 */
async function migrate() {
  console.log('\n🔧 Security Awareness Platform - Database Migration\n');
  
  try {
    // Create migrations tracking table
    await createMigrationsTable();
    
    // Run schema migration
    const schemaOk = await runSchemaMigration();
    if (!schemaOk) {
      process.exit(1);
    }
    
    console.log('\n✅ Migration complete!\n');
    
    // Show tables
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });
    
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

// Run migrations if called directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };
