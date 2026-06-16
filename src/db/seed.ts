/* eslint-disable no-console */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './index';
import {
  users,
  userPayments,
  courses,
  media,
  questionSheets,
  questions,
  questionOptions,
  exams,
  examAttempts,
  examAttemptAnswers,
  announcements,
  events,
  classMaterials,
  advertisements,
  feedback,
  subscribers,
  studentProfiles,
  teacherProfiles,
  teacherCourses,
} from './schema';
import { hashPassword } from '../utils/hash';
import { env } from '../config/env';

// Idempotent — called from server.ts on every startup.
// Ensures the admin account from .env exists; does nothing if already present.
export async function seedAdmin(): Promise<void> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, env.ADMIN_EMAIL))
    .limit(1);
  if (existing) return;

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
  const [first, ...rest] = env.ADMIN_NAME.split(' ');
  await db.insert(users).values({
    firstName: first ?? 'Admin',
    lastName: rest.join(' ') || 'User',
    email: env.ADMIN_EMAIL,
    phone: env.ADMIN_PHONE,
    passwordHash,
    role: 'admin',
    isVerified: true,
    isBlocked: false,
  });
  console.log(`[seedAdmin] Created admin user: ${env.ADMIN_EMAIL}`);
}

const COUNT = 15;
const RUN_TAG = Date.now().toString(36);

function suffix(i: number): string {
  return `${RUN_TAG}-${i}`;
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length] as T;
}

function pickMaybe<T>(arr: T[], i: number): T | null {
  if (arr.length === 0) return null;
  if (i % 4 === 3) return null;
  return arr[i % arr.length] as T;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedMedia() {
  console.log('• seeding media…');
  const rows = Array.from({ length: COUNT }, (_, i) => {
    const isPdf = i % 5 === 0;
    const ext = isPdf ? 'pdf' : 'jpg';
    return {
      filename: `seed-${suffix(i)}.${ext}`,
      originalName: `Seed File ${i + 1}.${ext}`,
      mimeType: isPdf ? 'application/pdf' : 'image/jpeg',
      size: rand(50_000, 2_000_000),
      url: `https://picsum.photos/seed/${suffix(i)}/800/600`,
      s3Key: `seeds/${RUN_TAG}/file-${i}.${ext}`,
    };
  });
  return db.insert(media).values(rows).returning();
}

async function seedUsers() {
  console.log('• seeding users…');
  // Need ≥15 of each role so student_profiles and teacher_profiles also reach 15.
  const password = await hashPassword('Password123!');
  const roles: ('admin' | 'teacher' | 'student')[] = ['admin', 'teacher', 'student'];
  const rows = roles.flatMap((role, rIdx) =>
    Array.from({ length: COUNT }, (_, i) => {
      const idx = rIdx * COUNT + i;
      return {
        firstName: `Seed${idx + 1}`,
        lastName: `User${idx + 1}`,
        email: `seed-${suffix(idx)}-${role}@example.local`,
        phone: `+977-${RUN_TAG}-${String(idx).padStart(4, '0')}`,
        passwordHash: password,
        role,
        isVerified: true,
        isBlocked: false,
      };
    }),
  );
  return db.insert(users).values(rows).returning();
}

async function seedCourses(mediaRows: { id: string }[]) {
  console.log('• seeding courses…');
  const types: ('online' | 'offline')[] = ['online', 'offline'];
  const rows = Array.from({ length: COUNT }, (_, i) => ({
    slug: `seed-course-${suffix(i)}`,
    title: `Seed Course ${suffix(i)}`,
    overview: `Overview for seed course ${i + 1}. A solid introduction.`,
    description: `Long-form description for seed course ${i + 1}.`,
    price: ((i + 1) * 500).toString(),
    durationDays: 30 + i * 5,
    courseType: types[i % types.length] ?? 'offline',
    image: null,
    mediaId: pickMaybe(mediaRows, i)?.id ?? null,
    isTrending: i % 4 === 0,
    isActive: true,
    freeFeatures: 'Free intro module',
    halfFeatures: 'Free + half-paid content',
    paidFeatures: 'Everything in course',
  }));
  return db.insert(courses).values(rows).returning();
}

async function seedStudentProfiles(
  studentUsers: { id: string }[],
  courseRows: { id: string }[],
) {
  console.log('• seeding student profiles…');
  if (studentUsers.length === 0) return [];
  const plans: ('free' | 'half' | 'paid')[] = ['free', 'half', 'paid'];
  const rows = studentUsers.map((u, i) => ({
    userId: u.id,
    plan: plans[i % plans.length] ?? 'free',
    courseId: pick(courseRows, i).id,
  }));
  return db.insert(studentProfiles).values(rows).returning();
}

async function seedTeacherProfiles(teacherUsers: { id: string }[]) {
  console.log('• seeding teacher profiles…');
  if (teacherUsers.length === 0) return [];
  const rows = teacherUsers.map((u, i) => ({
    userId: u.id,
    bio: `Seeded teacher #${i + 1} bio.`,
    specialization: pick(['Math', 'Science', 'English', 'Computer'], i),
    enableDisplayInAbout: i % 2 === 0,
  }));
  return db.insert(teacherProfiles).values(rows).returning();
}

async function seedTeacherCourses(
  teacherProfileRows: { id: string }[],
  courseRows: { id: string }[],
) {
  console.log('• seeding teacher_courses…');
  if (teacherProfileRows.length === 0) return [];
  const rows = Array.from({ length: COUNT }, (_, i) => ({
    teacherProfileId: pick(teacherProfileRows, i).id,
    courseId: pick(courseRows, i).id,
  }));
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    const k = `${r.teacherProfileId}:${r.courseId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (unique.length === 0) return [];
  return db.insert(teacherCourses).values(unique).onConflictDoNothing().returning();
}

async function seedQuestionSheets(creatorUsers: { id: string }[]) {
  console.log('• seeding question sheets…');
  const rows = Array.from({ length: COUNT }, (_, i) => ({
    sheetName: `Seed Sheet ${suffix(i)}`,
    createdBy: pickMaybe(creatorUsers, i)?.id ?? null,
  }));
  return db.insert(questionSheets).values(rows).returning();
}

async function seedQuestionsAndOptions(sheetRows: { id: string }[]) {
  console.log('• seeding questions + options…');
  const QUESTIONS_PER_SHEET = 5;
  const questionRows = sheetRows.flatMap((sheet, sIdx) =>
    Array.from({ length: QUESTIONS_PER_SHEET }, (_, qIdx) => ({
      sheetId: sheet.id,
      questionText: `What is the answer to seed question ${sIdx + 1}.${qIdx + 1}?`,
      marks: '1',
      sortOrder: qIdx,
    })),
  );
  const inserted = await db.insert(questions).values(questionRows).returning();

  const optionRows = inserted.flatMap((q, qIdx) =>
    Array.from({ length: 4 }, (_, oIdx) => ({
      questionId: q.id,
      optionText: `Option ${String.fromCharCode(65 + oIdx)} for Q${qIdx + 1}`,
      isCorrect: oIdx === qIdx % 4,
      sortOrder: oIdx,
    })),
  );
  const options = await db.insert(questionOptions).values(optionRows).returning();
  return { questions: inserted, options };
}

async function seedExams(sheetRows: { id: string }[], creators: { id: string }[]) {
  console.log('• seeding exams…');
  const now = Date.now();
  const rows = Array.from({ length: COUNT }, (_, i) => {
    const start = new Date(now - 1000 * 60 * 60 * 24 * (i % 5));
    const end = new Date(start.getTime() + 1000 * 60 * 60 * 24 * 30);
    return {
      examCode: `EXAM-${suffix(i).toUpperCase()}`,
      title: `Seed Exam ${suffix(i)}`,
      description: `Auto-seeded exam ${i + 1}.`,
      startDateTime: start,
      endDateTime: end,
      totalMarks: '20',
      passMarks: '10',
      durationMinutes: 30 + (i % 3) * 15,
      negativeMarking: i % 4 === 0,
      // Percentage of each wrong question's marks to deduct.
      negativeMarkingValue: i % 4 === 0 ? '25' : null,
      questionSheetId: pick(sheetRows, i).id,
      accessPlans: ['free', 'half', 'paid'],
      createdBy: pickMaybe(creators, i)?.id ?? null,
    };
  });
  return db.insert(exams).values(rows).returning();
}

async function seedExamAttempts(
  studentUserRows: { id: string }[],
  examRows: { id: string }[],
  questionRows: { id: string; sheetId: string }[],
  optionRows: { id: string; questionId: string; isCorrect: boolean }[],
) {
  console.log('• seeding exam attempts…');
  if (studentUserRows.length === 0 || examRows.length === 0) return [];

  const pairs: { userId: string; examId: string }[] = [];
  let i = 0;
  while (
    pairs.length < COUNT &&
    i < studentUserRows.length * examRows.length
  ) {
    const u = studentUserRows[i % studentUserRows.length]!;
    const e =
      examRows[Math.floor(i / studentUserRows.length) % examRows.length]!;
    pairs.push({ userId: u.id, examId: e.id });
    i++;
  }

  const examToSheet = new Map<string, string>();
  const examsWithSheet = await db
    .select({ id: exams.id, sheetId: exams.questionSheetId })
    .from(exams);
  for (const e of examsWithSheet) examToSheet.set(e.id, e.sheetId);

  const optionsByQuestion = new Map<string, typeof optionRows>();
  for (const o of optionRows) {
    const list = optionsByQuestion.get(o.questionId) ?? [];
    list.push(o);
    optionsByQuestion.set(o.questionId, list);
  }

  const insertedAttempts = await db
    .insert(examAttempts)
    .values(
      pairs.map((p) => {
        const submittedAt = new Date(
          Date.now() - rand(1, 7) * 24 * 60 * 60 * 1000,
        );
        const correct = rand(2, 5);
        const incorrect = rand(0, 5 - correct);
        return {
          userId: p.userId,
          examId: p.examId,
          startedAt: new Date(submittedAt.getTime() - 1000 * 60 * 30),
          submittedAt,
          status: 'submitted' as const,
          totalMarks: '5',
          marksObtained: correct.toString(),
          correctAnswers: correct,
          incorrectAnswers: incorrect,
          unanswered: Math.max(0, 5 - correct - incorrect),
          percentage: ((correct / 5) * 100).toFixed(2),
          timeTakenSeconds: rand(600, 1500),
        };
      }),
    )
    .onConflictDoNothing()
    .returning();

  const answerRows: (typeof examAttemptAnswers.$inferInsert)[] = [];
  for (const att of insertedAttempts) {
    const sheetId = examToSheet.get(att.examId);
    if (!sheetId) continue;
    const sheetQuestions = questionRows.filter((q) => q.sheetId === sheetId);
    for (const q of sheetQuestions) {
      const opts = optionsByQuestion.get(q.id) ?? [];
      if (opts.length === 0) continue;
      const chosen = pick(opts, rand(0, opts.length - 1));
      answerRows.push({
        attemptId: att.id,
        questionId: q.id,
        selectedOptionId: chosen.id,
        isCorrect: chosen.isCorrect,
        isFlagged: false,
        answeredAt: att.submittedAt ?? new Date(),
      });
    }
  }
  if (answerRows.length > 0) {
    await db.insert(examAttemptAnswers).values(answerRows);
  }
  console.log(
    `  ↳ inserted ${insertedAttempts.length} attempts + ${answerRows.length} answers`,
  );
  return insertedAttempts;
}

async function seedAnnouncements(
  mediaRows: { id: string }[],
  courseRows: { id: string }[],
) {
  console.log('• seeding announcements…');
  const rows = Array.from({ length: COUNT }, (_, i) => ({
    title: `Seed Announcement ${suffix(i)}`,
    description: `<p>This is the description for announcement ${i + 1}.</p>`,
    privacy: i % 3 === 0 ? 'enrolled' : 'public',
    mediaId: pickMaybe(mediaRows, i)?.id ?? null,
    courseId: i % 3 === 0 ? pick(courseRows, i).id : null,
  }));
  return db.insert(announcements).values(rows).returning();
}

async function seedEvents(mediaRows: { id: string }[]) {
  console.log('• seeding events…');
  const cats = ['Workshop', 'Webinar', 'Meetup', 'Conference', 'Other'];
  const rows = Array.from({ length: COUNT }, (_, i) => ({
    title: `Seed Event ${suffix(i)}`,
    description: `<p>Event description ${i + 1}.</p>`,
    category: pick(cats, i),
    eventDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
    address: `${100 + i} Seed Street, Kathmandu`,
    privacy: 'public',
    mediaId: pickMaybe(mediaRows, i)?.id ?? null,
  }));
  return db.insert(events).values(rows).returning();
}

async function seedClassMaterials(
  mediaRows: { id: string; url: string }[],
  courseRows: { id: string }[],
  creators: { id: string }[],
) {
  console.log('• seeding class materials…');
  if (mediaRows.length === 0 || courseRows.length === 0) return [];
  const rows = Array.from({ length: COUNT }, (_, i) => {
    const m = pick(mediaRows, i);
    return {
      title: `Seed Material ${suffix(i)}`,
      description: `<p>Material #${i + 1} for enrolled students.</p>`,
      mediaId: m.id,
      courseId: pick(courseRows, i).id,
      fileUrl: m.url,
      createdBy: pickMaybe(creators, i)?.id ?? null,
    };
  });
  return db.insert(classMaterials).values(rows).returning();
}

async function seedAdvertisements(mediaRows: { id: string; url: string }[]) {
  console.log('• seeding advertisements…');
  const rows = Array.from({ length: COUNT }, (_, i) => ({
    title: `Seed Ad ${suffix(i)}`,
    description: `Promotional copy for ad ${i + 1}.`,
    mediaId: pickMaybe(mediaRows, i)?.id ?? null,
    imageUrl: pickMaybe(mediaRows, i)?.url ?? null,
    linkUrl: `https://example.com/ad-${i}`,
    buttonText: 'Learn More',
    redirectUrl: `https://example.com/landing/${i}`,
    privacy: i % 2 === 0 ? 'public' : 'enrolled',
    isActive: true,
  }));
  return db.insert(advertisements).values(rows).returning();
}

async function seedFeedback() {
  console.log('• seeding feedback…');
  const rows = Array.from({ length: COUNT }, (_, i) => ({
    name: `Reviewer ${i + 1}`,
    email: `feedback-${suffix(i)}@example.local`,
    rating: ((i % 5) + 1) as number,
    feedbackText: `Auto-seeded feedback message ${i + 1}. Great course experience!`,
  }));
  return db.insert(feedback).values(rows).returning();
}

async function seedSubscribers() {
  console.log('• seeding subscribers…');
  const rows = Array.from({ length: COUNT }, (_, i) => ({
    email: `subscriber-${suffix(i)}@example.local`,
  }));
  return db.insert(subscribers).values(rows).onConflictDoNothing().returning();
}

async function seedUserPayments(allUsers: { id: string }[]) {
  console.log('• seeding user_payments…');
  if (allUsers.length === 0) return [];
  const rows = Array.from({ length: COUNT }, (_, i) => ({
    userId: pick(allUsers, i).id,
    paymentImageUrl: `https://picsum.photos/seed/pay-${suffix(i)}/400/300`,
    amount: ((i + 1) * 500).toString(),
    note: `Seed payment ${i + 1}`,
  }));
  return db.insert(userPayments).values(rows).returning();
}

async function main() {
  console.log(`\n🌱 Seeding (run tag: ${RUN_TAG}) — ${COUNT} rows per table\n`);

  const mediaRows = await seedMedia();
  const courseRows = await seedCourses(mediaRows);
  const userRows = await seedUsers();
  const students = userRows.filter((u) => u.role === 'student');
  const teachers = userRows.filter((u) => u.role === 'teacher');
  const privileged = userRows.filter(
    (u) => u.role === 'admin' || u.role === 'teacher',
  );

  await seedStudentProfiles(students, courseRows);
  const teacherProfileRows = await seedTeacherProfiles(teachers);
  await seedTeacherCourses(teacherProfileRows, courseRows);

  const sheetRows = await seedQuestionSheets(privileged);
  const { questions: questionRows, options: optionRows } =
    await seedQuestionsAndOptions(sheetRows);
  const examRows = await seedExams(sheetRows, privileged);
  await seedExamAttempts(students, examRows, questionRows, optionRows);

  await seedAnnouncements(mediaRows, courseRows);
  await seedEvents(mediaRows);
  await seedClassMaterials(mediaRows, courseRows, privileged);
  await seedAdvertisements(mediaRows);
  await seedFeedback();
  await seedSubscribers();
  await seedUserPayments(userRows);

  console.log('\n✅ Seeding complete.\n');
  process.exit(0);
}

// Only run main() when this file is executed directly (npm run db:seed),
// never when server.ts imports seedAdmin from it.
if (require.main === module) {
  main().catch((err) => {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  });
}
