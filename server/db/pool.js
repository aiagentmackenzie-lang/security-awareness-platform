/**
 * PostgreSQL Connection Pool
 * Security Awareness Platform
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration from environment variables
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'security_awareness',
  user: process.env.DB_USER || 'main',
  password: process.env.DB_PASSWORD || '',
  // Connection pool settings
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Return error after 2s if connection fails
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ PostgreSQL pool connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connected:', result.rows[0].current_time);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
}

/**
 * Execute a query with parameters
 * @param {string} text - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise}
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query:', { text: text.substring(0, 50), duration, rows: result.rowCount });
    return result;
  } catch (err) {
    console.error('Query error:', err.message);
    throw err;
  }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Client>}
 */
async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  
  // Log queries for debugging
  client.query = async (...args) => {
    const start = Date.now();
    const result = await originalQuery(...args);
    const duration = Date.now() - start;
    console.log('Client query:', { text: args[0].substring(0, 50), duration });
    return result;
  };
  
  return client;
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};
