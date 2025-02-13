import pg from 'pg';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initializeDatabase() {
  const { Pool } = pg;

  // Create a pool for the postgres database to create our app database
  const postgresPool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    database: 'postgres'
  });

  try {
    // Create the database if it doesn't exist
    await postgresPool.query(`
      SELECT 'CREATE DATABASE ${process.env.PGDATABASE}'
      WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${process.env.PGDATABASE}');
    `);

    // Close postgres connection
    await postgresPool.end();

    // Create a new pool for our app database
    const appPool = new Pool({
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT,
      database: process.env.PGDATABASE
    });

    // Read and execute the initialization SQL
    const initSQL = fs.readFileSync(join(__dirname, 'init.sql'), 'utf8');
    await appPool.query(initSQL);

    console.log('Database initialized successfully');
    await appPool.end();

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
