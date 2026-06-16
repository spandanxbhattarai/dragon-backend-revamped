/* eslint-disable no-console */
import 'dotenv/config';
import { db } from './index';
import * as schema from './schema';
import { count } from 'drizzle-orm';

const tables: [string, any][] = [
  ['users', schema.users],
  ['user_payments', schema.userPayments],
  ['media', schema.media],
  ['courses', schema.courses],
  ['student_profiles', schema.studentProfiles],
  ['teacher_profiles', schema.teacherProfiles],
  ['teacher_courses', schema.teacherCourses],
  ['question_sheets', schema.questionSheets],
  ['questions', schema.questions],
  ['question_options', schema.questionOptions],
  ['exams', schema.exams],
  ['exam_attempts', schema.examAttempts],
  ['exam_attempt_answers', schema.examAttemptAnswers],
  ['announcements', schema.announcements],
  ['events', schema.events],
  ['class_materials', schema.classMaterials],
  ['advertisements', schema.advertisements],
  ['feedback', schema.feedback],
  ['subscribers', schema.subscribers],
];

async function main() {
  console.log('\n📊 Row counts:\n');
  for (const [name, t] of tables) {
    const [{ c }] = await db.select({ c: count() }).from(t);
    const flag = c >= 15 ? '✓' : '✗';
    console.log(`  ${flag} ${name.padEnd(22)} ${c}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
