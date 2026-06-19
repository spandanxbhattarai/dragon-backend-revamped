/* eslint-disable no-console */
// Standalone seed for stress-testing the public courses page: creates a handful
// of categories and 120 courses spread across them (plus a few uncategorized).
// Run with:  npm run db:seed:courses
import 'dotenv/config';
import { db } from './index';
import { categories, courses } from './schema';
import { slugify } from '../utils/slugify';

const CATEGORY_NAMES = [
  'IOE Entrance Preparation',
  'Engineering Bridge',
  'Language Training',
  'Computer & IT',
  'Science & Mathematics',
  'Management & Accounting',
  'Test Preparation',
  'Short Courses',
];

const TYPES = ['online', 'offline'] as const;
const TOTAL_COURSES = 120;
// Tag keeps slugs/titles unique across repeated runs.
const TAG = Date.now().toString(36);

async function main() {
  console.log(`\n🌱 Seeding categories + ${TOTAL_COURSES} courses (tag: ${TAG})\n`);

  // 1) Categories — skip any that already exist (unique name).
  const existing = await db.select({ name: categories.name }).from(categories);
  const existingNames = new Set(existing.map((c) => c.name));
  const toCreate = CATEGORY_NAMES.filter((n) => !existingNames.has(n)).map((name) => ({
    name,
    slug: slugify(name),
    description: `${name} courses offered at Dragon Education.`,
  }));
  if (toCreate.length) {
    await db.insert(categories).values(toCreate).onConflictDoNothing();
    console.log(`• created ${toCreate.length} categories`);
  }

  // Fetch the categories we want to attach courses to.
  const allCats = await db.select({ id: categories.id, name: categories.name }).from(categories);
  const catPool = allCats.filter((c) => CATEGORY_NAMES.includes(c.name));
  console.log(`• ${catPool.length} categories available for assignment`);

  // 2) Courses — distribute across categories; leave ~5 uncategorized to
  //    exercise the "Uncategorized" group on the public page.
  const rows = Array.from({ length: TOTAL_COURSES }, (_, i) => {
    const uncategorized = i % 24 === 23; // ~5 of 120
    const cat = catPool.length ? catPool[i % catPool.length] : undefined;
    const price = ((i % 20) + 1) * 500; // 500..10000
    const discount = i % 3 === 0 ? (i % 5) * 10 : 0; // 0,10,20,30,40 sometimes
    const title = `Seed Course ${TAG}-${i + 1}`;
    return {
      slug: `${slugify(title)}`,
      title,
      overview: `Overview for ${title}. A solid, exam-focused program.`,
      description: `<p>Full description for <strong>${title}</strong>.</p>`,
      price: price.toString(),
      discount,
      durationDays: 30 + (i % 12) * 10,
      courseType: TYPES[i % TYPES.length],
      categoryId: uncategorized || !cat ? null : cat.id,
      image: null,
      isTrending: i % 7 === 0,
      isActive: true,
      freeFeatures: '<ul><li>Intro module</li></ul>',
      halfFeatures: '<ul><li>Intro + half content</li></ul>',
      paidFeatures: '<ul><li>Full access</li></ul>',
    };
  });

  // Insert in chunks to stay well within parameter limits.
  const CHUNK = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const res = await db.insert(courses).values(slice).onConflictDoNothing().returning({ id: courses.id });
    inserted += res.length;
  }
  console.log(`• inserted ${inserted} courses`);

  console.log('\n✅ Course seeding complete.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Course seed failed:', err);
  process.exit(1);
});
