import { db } from '../../db';
import { sql } from 'drizzle-orm';

interface LeaderboardFilters {
  examId?: string;
  courseId?: string;
  from?: string;
  to?: string;
}

interface Pagination {
  offset: number;
  limit: number;
}

export const leaderboardRepository = {
  getLeaderboard: async (filters: LeaderboardFilters, pagination: Pagination) => {
    const conditions: string[] = ["ea.status = 'submitted'"];

    if (filters.examId) {
      conditions.push(`ea.exam_id = '${filters.examId}'`);
    }

    if (filters.courseId) {
      conditions.push(`sp.course_id = '${filters.courseId}'`);
    }

    if (filters.from) {
      conditions.push(`ea.submitted_at >= '${filters.from}'::date`);
    }

    if (filters.to) {
      // Inclusive of the whole "to" day (up to, but not including, the next day).
      conditions.push(`ea.submitted_at < ('${filters.to}'::date + interval '1 day')`);
    }

    const whereClause = conditions.join(' AND ');

    const rankedQuery = sql.raw(`
      WITH ranked AS (
        SELECT
          ea.id                       AS attempt_id,
          ea.user_id,
          u.first_name,
          u.last_name,
          e.id                        AS exam_id,
          e.title                     AS exam_title,
          ea.marks_obtained           AS score,
          ea.total_marks,
          ea.percentage,
          ea.time_taken_seconds,
          ea.submitted_at,
          e.pass_marks,
          ROW_NUMBER() OVER (
            ORDER BY ea.percentage DESC, ea.marks_obtained DESC, ea.time_taken_seconds ASC
          ) AS rank
        FROM exam_attempts ea
        INNER JOIN users u ON u.id = ea.user_id
        LEFT JOIN student_profiles sp ON sp.user_id = u.id
        INNER JOIN exams e ON e.id = ea.exam_id
        WHERE ${whereClause}
      )
      SELECT
        rank,
        user_id,
        first_name,
        last_name,
        exam_id,
        exam_title,
        score,
        total_marks,
        percentage,
        time_taken_seconds,
        submitted_at,
        CASE
          WHEN pass_marks IS NULL THEN NULL
          WHEN score::numeric >= pass_marks::numeric THEN 'pass'
          ELSE 'fail'
        END AS status
      FROM ranked
      ORDER BY rank
      LIMIT ${pagination.limit} OFFSET ${pagination.offset}
    `);

    const countQuery = sql.raw(`
      SELECT COUNT(*) AS total
      FROM exam_attempts ea
      INNER JOIN users u ON u.id = ea.user_id
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      INNER JOIN exams e ON e.id = ea.exam_id
      WHERE ${whereClause}
    `);

    const [rows, countResult] = await Promise.all([
      db.execute(rankedQuery),
      db.execute(countQuery),
    ]);

    const total = parseInt(String((countResult.rows[0] as any)?.total ?? '0'), 10);

    return {
      data: rows.rows as Array<{
        rank: number;
        user_id: string;
        first_name: string;
        last_name: string;
        exam_id: string;
        exam_title: string;
        score: string;
        total_marks: string;
        percentage: string;
        time_taken_seconds: number;
        submitted_at: Date;
        status: 'pass' | 'fail' | null;
      }>,
      total,
    };
  },
};
