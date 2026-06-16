import { db } from '../../db';
import {
  activeSessions,
  analyticsDaily,
  analyticsUtmSources,
  analyticsVisitorSessions,
  users,
  courses,
  exams,
  studentProfiles,
  feedback,
  subscribers,
} from '../../db/schema';
import { eq, and, gte, lte, desc, count, sql } from 'drizzle-orm';
import { PaginationResult } from '../../utils/paginate';

export const analyticsRepository = {
  upsertActiveSession: async (
    userId: string,
    sessionToken: string,
    pagePath: string | undefined,
    ipAddress: string | undefined,
    userAgent: string | undefined,
  ) => {
    const existing = await db
      .select()
      .from(activeSessions)
      .where(eq(activeSessions.sessionToken, sessionToken))
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .update(activeSessions)
        .set({ lastSeen: new Date(), pagePath: pagePath ?? existing[0].pagePath })
        .where(eq(activeSessions.sessionToken, sessionToken))
        .returning();
      return updated;
    }

    const [inserted] = await db
      .insert(activeSessions)
      .values({ userId, sessionToken, pagePath: pagePath ?? null, ipAddress: ipAddress ?? null, userAgent: userAgent ?? null, lastSeen: new Date() })
      .returning();
    return inserted;
  },

  countActiveSessions: async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = await db
      .select({ count: count() })
      .from(activeSessions)
      .where(gte(activeSessions.lastSeen, fiveMinutesAgo));
    return result[0]?.count ?? 0;
  },

  cleanupOldSessions: async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    await db.delete(activeSessions).where(lte(activeSessions.lastSeen, thirtyMinutesAgo));
  },

  upsertDailyStats: async (date: string, field: string, increment: number) => {
    const existing = await db
      .select()
      .from(analyticsDaily)
      .where(eq(analyticsDaily.date, date))
      .limit(1);

    if (existing[0]) {
      const current = existing[0] as Record<string, unknown>;
      const currentVal = parseInt(String(current[field] ?? '0'), 10);
      await db
        .update(analyticsDaily)
        .set({ [field]: currentVal + increment })
        .where(eq(analyticsDaily.date, date));
    } else {
      await db.insert(analyticsDaily).values({ date, [field]: increment });
    }
  },

  trackVisitorSession: async (sessionToken: string, date: string): Promise<boolean> => {
    const result = await db
      .insert(analyticsVisitorSessions)
      .values({ sessionToken, date })
      .onConflictDoNothing()
      .returning();
    return result.length > 0;
  },

  upsertUtmSource: async (date: string, source: string, increment: number) => {
    const existing = await db
      .select()
      .from(analyticsUtmSources)
      .where(and(eq(analyticsUtmSources.date, date), eq(analyticsUtmSources.source, source)))
      .limit(1);

    if (existing[0]) {
      await db
        .update(analyticsUtmSources)
        .set({ visits: (existing[0].visits ?? 0) + increment })
        .where(and(eq(analyticsUtmSources.date, date), eq(analyticsUtmSources.source, source)));
    } else {
      await db.insert(analyticsUtmSources).values({ date, source, visits: increment });
    }
  },

  getDailyStats: async (from?: string, to?: string) => {
    const conditions = [];
    if (from) conditions.push(gte(analyticsDaily.date, from));
    if (to) conditions.push(lte(analyticsDaily.date, to));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    return await db.select().from(analyticsDaily).where(whereClause).orderBy(analyticsDaily.date);
  },

  getDashboardSummary: async () => {
    const today = new Date().toISOString().slice(0, 10);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // analytics_daily.date is a DATE column (stored as YYYY-MM-DD strings),
    // so weekly windows compare against the string form, not a Date object.
    const sevenDaysAgoDate = sevenDaysAgo.toISOString().slice(0, 10);

    const [
      totalUsersResult,
      totalCoursesResult,
      activeSessionsResult,
      totalExamsResult,
      recentRegsResult,
      planDistResult,
      totalFeedbackResult,
      totalSubscribersResult,
      todayStatsResult,
      utmResult,
      totalVisitorsResult,
      uniqueSessionsResult,
      weeklyVisitorsResult,
      visitorTrendResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(courses),
      db.select({ count: count() }).from(activeSessions).where(gte(activeSessions.lastSeen, fiveMinutesAgo)),
      db.select({ count: count() }).from(exams),
      db.select({ count: count() }).from(users).where(gte(users.createdAt, sevenDaysAgo)),
      db.select({ plan: studentProfiles.plan, count: count() }).from(studentProfiles).groupBy(studentProfiles.plan),
      db.select({ count: count() }).from(feedback),
      db.select({ count: count() }).from(subscribers),
      db.select().from(analyticsDaily).where(eq(analyticsDaily.date, today)).limit(1),
      db
        .select({ source: analyticsUtmSources.source, visits: sql<number>`sum(${analyticsUtmSources.visits})::int` })
        .from(analyticsUtmSources)
        .groupBy(analyticsUtmSources.source)
        .orderBy(desc(sql`sum(${analyticsUtmSources.visits})`))
        .limit(8),
      // All-time visitors (sum of daily unique visitors).
      db
        .select({ total: sql<number>`coalesce(sum(${analyticsDaily.totalVisitors}), 0)::int` })
        .from(analyticsDaily),
      // Distinct visitor sessions ever tracked.
      db
        .select({ total: sql<number>`count(distinct ${analyticsVisitorSessions.sessionToken})::int` })
        .from(analyticsVisitorSessions),
      // Visitors over the last 7 days.
      db
        .select({ total: sql<number>`coalesce(sum(${analyticsDaily.totalVisitors}), 0)::int` })
        .from(analyticsDaily)
        .where(gte(analyticsDaily.date, sevenDaysAgoDate)),
      // Per-day series for the last 7 days, for the dashboard graph.
      db
        .select({
          date: analyticsDaily.date,
          visitors: analyticsDaily.totalVisitors,
          pageViews: analyticsDaily.totalPageViews,
        })
        .from(analyticsDaily)
        .where(gte(analyticsDaily.date, sevenDaysAgoDate))
        .orderBy(analyticsDaily.date),
    ]);

    return {
      totalUsers: totalUsersResult[0]?.count ?? 0,
      totalCourses: totalCoursesResult[0]?.count ?? 0,
      activeSessionsNow: activeSessionsResult[0]?.count ?? 0,
      totalExams: totalExamsResult[0]?.count ?? 0,
      recentRegistrations: recentRegsResult[0]?.count ?? 0,
      planDistribution: planDistResult.map((r) => ({ plan: r.plan, count: r.count })),
      totalFeedback: totalFeedbackResult[0]?.count ?? 0,
      totalSubscribers: totalSubscribersResult[0]?.count ?? 0,
      todayPageViews: todayStatsResult[0]?.totalPageViews ?? 0,
      todayVisitors: todayStatsResult[0]?.totalVisitors ?? 0,
      todayNewRegistrations: todayStatsResult[0]?.newRegistrations ?? 0,
      utmSources: utmResult.map((r) => ({ source: r.source, visits: r.visits ?? 0 })),
      totalVisitors: totalVisitorsResult[0]?.total ?? 0,
      uniqueSessions: uniqueSessionsResult[0]?.total ?? 0,
      weeklyVisitors: weeklyVisitorsResult[0]?.total ?? 0,
      visitorTrend: visitorTrendResult.map((r) => ({
        date: r.date,
        visitors: r.visitors ?? 0,
        pageViews: r.pageViews ?? 0,
      })),
    };
  },
};
