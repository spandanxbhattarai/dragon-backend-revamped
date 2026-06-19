import { db } from '../../db';
import { categories } from '../../db/schema';
import { asc, eq, count } from 'drizzle-orm';

export const categoriesRepository = {
  findAll: async (pagination?: { offset: number; limit: number }) => {
    const base = db.select().from(categories).orderBy(asc(categories.name));
    if (pagination) {
      return base.limit(pagination.limit).offset(pagination.offset);
    }
    return base;
  },

  countAll: async () => {
    const [row] = await db.select({ total: count() }).from(categories);
    return row?.total ?? 0;
  },

  findById: async (id: string) => {
    const [row] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return row ?? null;
  },

  create: async (data: typeof categories.$inferInsert) => {
    const [row] = await db.insert(categories).values(data).returning();
    return row;
  },

  update: async (id: string, data: Partial<typeof categories.$inferInsert>) => {
    const [row] = await db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return row;
  },

  remove: async (id: string) => {
    await db.delete(categories).where(eq(categories.id, id));
  },

  findSlugs: async () => {
    const result = await db.select({ slug: categories.slug }).from(categories);
    return result.map((r) => r.slug);
  },
};
