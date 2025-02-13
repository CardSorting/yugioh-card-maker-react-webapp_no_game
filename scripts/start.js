#!/usr/bin/env node
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function waitForProcess(childProcess) {
  return new Promise((resolve, reject) => {
    childProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
    
    childProcess.on('error', reject);
  });
}

async function main() {
  try {
    // Run database setup first
    console.log('Setting up database...');
    const dbSetup = spawn('node', ['scripts/setup-db.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    await waitForProcess(dbSetup);
    console.log('Database setup completed');

    // Start the server
    console.log('Starting server...');
    const server = spawn('node', ['server.js'], {
      stdio: 'inherit',
      shell: true
    });

    // Handle server process
    server.on('error', (err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });

    // Forward SIGTERM and SIGINT
    process.on('SIGTERM', () => server.kill('SIGTERM'));
    process.on('SIGINT', () => server.kill('SIGINT'));

    await waitForProcess(server);
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
