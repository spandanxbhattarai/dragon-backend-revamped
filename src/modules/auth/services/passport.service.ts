import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { authRepository } from '../auth.repository';
import { comparePassword } from '../../../utils/hash';
import { env } from '../../../config/env';

export const configurePassport = () => {
  passport.use(
    new LocalStrategy({ usernameField: 'email', session: false }, async (email, password, done) => {
      try {
        const user = await authRepository.findUserByEmail(email);
        if (!user) return done(null, false, { message: 'Invalid email or password' });

        if (user.loginLocked) return done(null, false, { message: 'Account is locked' });
        if (user.isBlocked) return done(null, false, { message: 'Account is blocked' });

        const valid = await comparePassword(password, user.passwordHash);
        if (!valid) {
          const newAttempts = user.failedLoginAttempts + 1;
          const shouldLock = newAttempts >= env.MAX_FAILED_LOGIN_ATTEMPTS;
          await authRepository.recordFailedLogin(user.id, newAttempts, shouldLock);
          const msg = shouldLock ? 'Account is locked' : 'Invalid email or password';
          return done(null, false, { message: msg });
        }

        await authRepository.recordSuccessfulLogin(user.id);

        return done(null, { userId: user.id, role: user.role });
      } catch (err) {
        return done(err);
      }
    }),
  );
};
