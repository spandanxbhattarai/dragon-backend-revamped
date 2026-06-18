import { siteContentRepository } from './site-content.repository';
import {
  SITE_CONTENT_KEYS,
  SiteContentKey,
  DEFAULT_CONTENT,
  parseSection,
} from './site-content.schema';

export const siteContentService = {
  // Returns every section as a { key: data } map, falling back to defaults for
  // any key not yet stored so the public site always has content.
  getAll: async (): Promise<Record<string, unknown>> => {
    const rows = await siteContentRepository.findAll();
    const stored = new Map(rows.map((r) => [r.key, r.data]));
    const result: Record<string, unknown> = {};
    for (const key of SITE_CONTENT_KEYS) {
      result[key] = stored.get(key) ?? DEFAULT_CONTENT[key];
    }
    return result;
  },

  getByKey: async (key: SiteContentKey): Promise<unknown> => {
    const row = await siteContentRepository.findByKey(key);
    return row?.data ?? DEFAULT_CONTENT[key];
  },

  // Validates the body against the section's schema, then upserts.
  update: async (key: SiteContentKey, data: unknown) => {
    const parsed = parseSection(key, data);
    const row = await siteContentRepository.upsert(key, parsed);
    return { key: row.key, data: row.data, updatedAt: row.updatedAt };
  },

  // Idempotent startup seed — inserts defaults for any missing section.
  seedDefaults: async (): Promise<void> => {
    for (const key of SITE_CONTENT_KEYS) {
      await siteContentRepository.insertIfMissing(key, DEFAULT_CONTENT[key]);
    }
  },
};
