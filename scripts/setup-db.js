import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function setupDatabase() {
  console.log('Starting database setup...');

  const { Pool } = pg;
  
  // Create connection pool
  const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');

    // Run initialization script with error handling for existing tables
    console.log('Initializing database schema...');
    const initSQL = fs.readFileSync(
      join(__dirname, '../src/db/init.sql'),
      'utf8'
    );

    try {
      await pool.query(initSQL);
      console.log('✓ Database schema initialized');
    } catch (error) {
      if (error.code === '42P07') { // duplicate_table error code
        console.log('Tables already exist, skipping initialization');
      } else {
        throw error;
      }
    }

    // Create test user if in development
    if (process.env.NODE_ENV === 'development') {
      try {
        const { rows: [existingUser] } = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          ['test@example.com']
        );

        if (!existingUser) {
          const { v4: uuidv4 } = await import('uuid');
          const bcrypt = await import('bcrypt');

          const userId = uuidv4();
          const hashedPassword = await bcrypt.hash('password123', 10);

          await pool.query(
            'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)',
            [userId, 'test@example.com', hashedPassword]
          );

          await pool.query(
            'INSERT INTO profiles (id, username) VALUES ($1, $2)',
            [userId, 'testuser']
          );

          console.log('✓ Test user created (email: test@example.com, password: password123)');
        } else {
          console.log('✓ Test user already exists');
        }
      } catch (error) {
        console.error('Error creating test user:', error);
        // Don't exit on test user creation failure
      }
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error during database setup:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase().catch(console.error);
