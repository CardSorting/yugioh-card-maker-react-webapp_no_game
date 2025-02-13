import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

export interface DBResult<T> {
  rows: T[];
  rowCount: number;
}

export interface QueryConfig {
  text: string;
  values?: any[];
}

export type QueryResultType<T extends Record<string, any>> = Promise<QueryResult<T>>;

const dbClient = {
  query: <T extends Record<string, any>>(text: string, values?: any[]): QueryResultType<T> => {
    return pool.query<T>(text, values);
  },
  getClient: () => pool.connect(),
  transaction: async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};

export default dbClient;
