import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

import { db, user, projects, assets } from './index';
import { eq } from 'drizzle-orm';
import { auth } from '../lib/auth';
import { grantSignupCredits } from '../lib/credits';

const demoEmail = process.env.DEMO_USER_EMAIL || 'demo@shopshot.dev';
const demoPassword = process.env.DEMO_USER_PASSWORD || 'demo123456';
const demoName = 'Demo User';

async function seed() {
  console.log(`Starting database seed for demo user: ${demoEmail}...`);

  try {
    // 1. Check or create demo user
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, demoEmail))
      .limit(1);

    let userId: string;

    if (existingUser.length === 0) {
      console.log('Creating demo user via Better Auth...');
      const created = await auth.api.signUpEmail({
        body: {
          email: demoEmail,
          password: demoPassword,
          name: demoName,
        },
      });

      if (!created || !created.user) {
        throw new Error('Failed to create demo user');
      }

      userId = created.user.id;
      console.log(`Demo user created with ID: ${userId}`);
    } else {
      const existing = existingUser[0];
      if (!existing) {
        throw new Error('User not found');
      }
      userId = existing.id;
      console.log(`Demo user exists with ID: ${userId}`);
    }

    // 2. Ensure initial signup credits
    await grantSignupCredits(userId, 30);

    // 3. Check or create sample project
    const existingProject = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .limit(1);

    if (existingProject.length === 0) {
      console.log('Creating sample project and original asset...');
      const createdProjects = await db
        .insert(projects)
        .values({
          userId,
          name: 'Ceramic Artisan Mug',
          productDescription:
            'A minimalist matte black ceramic coffee mug with ergonomic handle and bamboo coaster.',
        })
        .returning();

      const newProject = createdProjects[0];
      if (!newProject) {
        throw new Error('Failed to create sample project');
      }

      // Create sample original asset
      const createdAssets = await db
        .insert(assets)
        .values({
          projectId: newProject.id,
          userId,
          kind: 'original',
          blobUrl:
            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
          blobPathname: 'samples/ceramic-mug.jpg',
          width: 1200,
          height: 1200,
          mimeType: 'image/jpeg',
          sizeBytes: 245000,
        })
        .returning();

      const sampleAsset = createdAssets[0];
      if (!sampleAsset) {
        throw new Error('Failed to create sample asset');
      }

      // Set cover asset
      await db
        .update(projects)
        .set({ coverAssetId: sampleAsset.id })
        .where(eq(projects.id, newProject.id));

      console.log(`Sample project created: ${newProject.name} (${newProject.id})`);
    } else {
      console.log('Sample project already exists.');
    }

    console.log('Database seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
