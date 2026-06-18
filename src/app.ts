import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import { globalErrorHandler } from './lib/error-handler';
import { env } from './config/env';
import { configurePassport } from './modules/auth/services/passport.service';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import courseRoutes from './modules/courses/courses.routes';
import questionSheetRoutes from './modules/questions/questions.routes';
import examRoutes from './modules/exams/exams.routes';
import examAttemptRoutes from './modules/exam-attempts/exam-attempts.routes';
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes';
import announcementRoutes from './modules/announcements/announcements.routes';
import eventRoutes from './modules/events/events.routes';
import classMaterialRoutes from './modules/class-materials/class-materials.routes';
import advertisementRoutes from './modules/advertisements/advertisements.routes';
import homeVideosRoutes from './modules/home-videos/home-videos.routes';
import siteContentRoutes from './modules/site-content/site-content.routes';
import feedbackRoutes from './modules/feedback/feedback.routes';
import contactRoutes from './modules/contact/contact.routes';
import subscriberRoutes from './modules/subscribers/subscribers.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import fileRoutes from './modules/files/files.routes';
import mediaRoutes from './modules/media/media.routes';

configurePassport();

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? env.FRONTEND_URL
    : [env.FRONTEND_URL, 'http://localhost:3000'],
  credentials: true,
}));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/question-sheets', questionSheetRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/exam-attempts', examAttemptRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/class-materials', classMaterialRoutes);
app.use('/api/advertisements', advertisementRoutes);
app.use('/api/home-videos', homeVideosRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/media', mediaRoutes);

app.use(globalErrorHandler);

export default app;
