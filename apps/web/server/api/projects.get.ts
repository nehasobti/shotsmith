import { eq, desc, sql } from 'drizzle-orm';
import { db, projects, assets } from '../db';
import { requireUserSession } from '../utils/auth';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const userId = session.user.id;

  const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      productDescription: projects.productDescription,
      coverAssetId: projects.coverAssetId,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      imageCount: sql<number>`(select count(*) from ${assets} where ${assets.projectId} = ${projects.id})::int`,
    })
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));

  return {
    projects: userProjects,
  };
});
