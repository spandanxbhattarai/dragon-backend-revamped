import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { db } from './db';
import { seedAdmin } from './db/seed';
import { siteContentService } from './modules/site-content/site-content.service';
import { sql } from 'drizzle-orm';

const start = async () => {
  try {
    await db.execute(sql`SELECT 1`);
    console.log('Database connection established');

    await seedAdmin();
    await siteContentService.seedDefaults();

    app.listen(env.PORT, () => {
      console.log(`Dragon Institute API running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
