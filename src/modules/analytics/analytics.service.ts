import { analyticsRepository } from './analytics.repository';

const toDateString = (d: Date) => d.toISOString().slice(0, 10);

// Visitor/page-view analytics only count the public-facing site. Anything under
// the authenticated app (the dashboard) is excluded so internal navigation never
// inflates the numbers.
const isPublicPath = (pagePath: string | undefined): boolean => {
  if (!pagePath) return false;
  const path = pagePath.split('?')[0];
  return !path.startsWith('/dashboard');
};

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
    // Only the public site is tracked — ignore dashboard / app navigation.
    if (!isPublicPath(pagePath)) {
      return { ok: true };
    }

    const today = toDateString(new Date());

    // Count this page view at most once per (session, page, day). A reload or a
    // retried request hits the same key and is ignored.
    const [isNewVisitor, isNewPageView] = await Promise.all([
      analyticsRepository.trackVisitorSession(sessionToken, today),
      analyticsRepository.trackPageView(sessionToken, pagePath, today),
    ]);

    if (isNewPageView) {
      await analyticsRepository.upsertDailyStats(today, 'totalPageViews', 1);
    }

    if (isNewVisitor) {
      await analyticsRepository.upsertDailyStats(today, 'totalVisitors', 1);
      // A UTM source is only meaningful on a visitor's first landing of the day.
      if (utmSource) {
        await analyticsRepository.upsertUtmSource(today, utmSource, 1);
      }
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
