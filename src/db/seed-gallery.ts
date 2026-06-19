/* eslint-disable no-console */
// Seeds the gallery with a mix of images and videos using public sample URLs.
// Idempotent-ish: removes its own previously-seeded rows first (title prefix).
// Run with:  npm run db:seed:gallery
import 'dotenv/config';
import { ilike } from 'drizzle-orm';
import { db } from './index';
import { galleryItems } from './schema';

const SEED_PREFIX = 'Seed Gallery';

// Public, hotlink-friendly sample videos (Google sample bucket).
const SAMPLE_VIDEOS = [
  'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
];

const IMAGE_COUNT = 32;
const VIDEO_COUNT = 14;

type Row = typeof galleryItems.$inferInsert;

async function main() {
  console.log('\n🌱 Seeding gallery (images + videos)\n');

  // Clean up prior seeded rows so re-runs don't pile up duplicates.
  await db.delete(galleryItems).where(ilike(galleryItems.title, `${SEED_PREFIX}%`));

  const rows: Row[] = [];
  let position = 0;

  // Interleave images and videos so the public grid looks varied.
  for (let i = 0; i < Math.max(IMAGE_COUNT, VIDEO_COUNT); i++) {
    if (i < IMAGE_COUNT) {
      rows.push({
        title: `${SEED_PREFIX} Photo ${i + 1}`,
        description: 'A moment from our classrooms, events, and community.',
        mediaType: 'image',
        mediaUrl: `https://picsum.photos/seed/dragon-gallery-${i + 1}/1200/800`,
        thumbnailUrl: `https://picsum.photos/seed/dragon-gallery-${i + 1}/600/400`,
        position: position++,
        isActive: true,
      });
    }
    if (i < VIDEO_COUNT) {
      rows.push({
        title: `${SEED_PREFIX} Video ${i + 1}`,
        description: 'Highlights and sessions from Dragon Education.',
        mediaType: 'video',
        mediaUrl: SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length],
        thumbnailUrl: `https://picsum.photos/seed/dragon-poster-${i + 1}/1200/675`,
        position: position++,
        isActive: true,
      });
    }
  }

  const CHUNK = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const res = await db
      .insert(galleryItems)
      .values(rows.slice(i, i + CHUNK))
      .returning({ id: galleryItems.id });
    inserted += res.length;
  }

  console.log(`• inserted ${inserted} gallery items (${IMAGE_COUNT} images + ${VIDEO_COUNT} videos)`);
  console.log('\n✅ Gallery seeding complete.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Gallery seed failed:', err);
  process.exit(1);
});
