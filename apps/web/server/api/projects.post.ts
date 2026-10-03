import { db, projects } from '../db';
import { requireUserSession } from '../utils/auth';
import { createProjectSchema } from '@shopshot/shared';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const userId = session.user.id;

  const rawBody = await readBody(event);
  const parsed = createProjectSchema.safeParse(rawBody);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid project input data.',
        },
      },
    });
  }

  const { name, product_description } = parsed.data;

  const [newProject] = await db
    .insert(projects)
    .values({
      userId,
      name,
      productDescription: product_description ?? null,
    })
    .returning();

  return {
    project: newProject,
  };
});
