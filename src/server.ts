import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { db } from './db';
import { seedAdmin } from './db/seed';
import { sql } from 'drizzle-orm';

const start = async () => {
  try {
    await db.execute(sql`SELECT 1`);
    console.log('Database connection established');

    await seedAdmin();

    app.listen(env.PORT, () => {
      console.log(`Dragon Institute API running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
