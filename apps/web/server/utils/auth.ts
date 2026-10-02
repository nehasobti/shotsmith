import type { H3Event } from 'h3';
import { auth } from '../lib/auth';

export async function requireUserSession(event: H3Event) {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session || !session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: {
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to access this resource.',
        },
      },
    });
  }

  return session;
}
