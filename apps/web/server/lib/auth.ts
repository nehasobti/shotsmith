import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db, user, session, account, verification } from '../db';
import { grantSignupCredits } from './credits';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET || 'default-secret-needs-to-be-over-32-characters-shopshot-ai',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    ...(googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {}),
  },
  databaseHooks: {
    user: {
      create: {
        after: async (newUser) => {
          const signupCredits = Number(process.env.SIGNUP_CREDITS || '30');
          try {
            await grantSignupCredits(newUser.id, signupCredits);
          } catch (err) {
            console.error('Failed to grant signup credits:', err);
          }
        },
      },
    },
  },
});
