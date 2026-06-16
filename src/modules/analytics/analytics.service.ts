import { analyticsRepository } from './analytics.repository';

const toDateString = (d: Date) => d.toISOString().slice(0, 10);

export const analyticsService = {
  heartbeat: async (
    userId: string,
    sessionToken: string,
    pagePath: string | undefined,
    ipAddress: string | undefined,
    userAgent: string | undefined,
  ) => {
    await analyticsRepository.upsertActiveSession(
      userId,
      sessionToken,
      pagePath,
      ipAddress,
      userAgent,
    );

    // Occasionally clean up stale sessions (roughly 5% of requests)
    if (Math.random() < 0.05) {
      analyticsRepository.cleanupOldSessions().catch(() => void 0);
    }

    return { ok: true };
  },

  recordPageview: async (
    sessionToken: string,
    pagePath: string,
    utmSource: string | undefined,
    ipAddress: string | undefined,
  ) => {
    const today = toDateString(new Date());

    const [isNewVisitor] = await Promise.all([
      analyticsRepository.trackVisitorSession(sessionToken, today),
      analyticsRepository.upsertDailyStats(today, 'totalPageViews', 1),
    ]);

    if (isNewVisitor) {
      await analyticsRepository.upsertDailyStats(today, 'totalVisitors', 1);
    }

    if (utmSource) {
      await analyticsRepository.upsertUtmSource(today, utmSource, 1);
    }

    return { ok: true };
  },

  getActiveNow: async () => {
    const count = await analyticsRepository.countActiveSessions();
    return { activeSessionsNow: count };
  },

  getDailyStats: async (query: { from?: string; to?: string }) => {
    const { from, to } = query;
    return await analyticsRepository.getDailyStats(from, to);
  },

  getDashboardSummary: async () => {
    return await analyticsRepository.getDashboardSummary();
  },
};
