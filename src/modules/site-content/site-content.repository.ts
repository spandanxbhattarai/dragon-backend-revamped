import { db } from '../../db';
import { siteContent } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const siteContentRepository = {
  findAll: async () => {
    return db
      .select({ key: siteContent.key, data: siteContent.data, updatedAt: siteContent.updatedAt })
      .from(siteContent);
  },

  findByKey: async (key: string) => {
    const [row] = await db
      .select({ key: siteContent.key, data: siteContent.data, updatedAt: siteContent.updatedAt })
      .from(siteContent)
      .where(eq(siteContent.key, key))
      .limit(1);
    return row ?? null;
  },

  // Insert the section if it doesn't exist, otherwise overwrite its data.
  upsert: async (key: string, data: unknown) => {
    const [row] = await db
      .insert(siteContent)
      .values({ key, data })
      .onConflictDoUpdate({
        target: siteContent.key,
        set: { data, updatedAt: new Date() },
      })
      .returning({ key: siteContent.key, data: siteContent.data, updatedAt: siteContent.updatedAt });
    return row;
  },

  // Insert only if absent — used by the idempotent startup seed.
  insertIfMissing: async (key: string, data: unknown) => {
    await db.insert(siteContent).values({ key, data }).onConflictDoNothing({ target: siteContent.key });
  },
};
