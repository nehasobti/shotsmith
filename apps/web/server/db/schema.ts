import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const assetKindEnum = pgEnum('asset_kind', [
  'original',
  'cutout',
  'scene',
  'edit',
  'upscale',
  'export',
]);

export const jobTypeEnum = pgEnum('job_type', [
  'remove_bg',
  'scene',
  'edit',
  'upscale',
]);

export const jobStatusEnum = pgEnum('job_status', [
  'queued',
  'running',
  'succeeded',
  'failed',
]);

export const jobProviderEnum = pgEnum('job_provider', ['google', 'fal']);

export const copyToneEnum = pgEnum('copy_tone', [
  'professional',
  'playful',
  'luxury',
  'minimal',
]);

export const creditReasonEnum = pgEnum('credit_reason', [
  'signup_grant',
  'daily_grant',
  'job_charge',
  'job_refund',
  'purchase',
]);

// ----------------- Better Auth Tables -----------------
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ----------------- App Tables -----------------
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  productDescription: text('product_description'),
  coverAssetId: uuid('cover_asset_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const assets = pgTable(
  'assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    parentAssetId: uuid('parent_asset_id'),
    jobId: uuid('job_id'),
    kind: assetKindEnum('kind').notNull(),
    blobUrl: text('blob_url').notNull(),
    blobPathname: text('blob_pathname').notNull(),
    width: integer('width'),
    height: integer('height'),
    mimeType: varchar('mime_type', { length: 50 }),
    sizeBytes: integer('size_bytes'),
    isFavorite: boolean('is_favorite').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('assets_project_created_idx').on(table.projectId, table.createdAt),
  ]
);

export const generationJobs = pgTable(
  'generation_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    sourceAssetId: uuid('source_asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    type: jobTypeEnum('type').notNull(),
    status: jobStatusEnum('status').notNull().default('queued'),
    provider: jobProviderEnum('provider').notNull(),
    model: varchar('model', { length: 100 }).notNull(),
    params: jsonb('params').notNull().default({}),
    externalRequestId: varchar('external_request_id', { length: 200 }),
    creditsCharged: integer('credits_charged').notNull().default(0),
    costUsd: numeric('cost_usd', { precision: 10, scale: 6 }),
    error: text('error'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('jobs_user_created_idx').on(table.userId, table.createdAt),
    index('jobs_external_req_idx').on(table.externalRequestId),
  ]
);

export const copyGenerations = pgTable('copy_generations', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  tone: copyToneEnum('tone').notNull(),
  language: varchar('language', { length: 10 }).notNull().default('en'),
  output: jsonb('output').notNull(),
  tokens: integer('tokens'),
  costUsd: numeric('cost_usd', { precision: 10, scale: 6 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const creditLedger = pgTable(
  'credit_ledger',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    reason: creditReasonEnum('reason').notNull(),
    jobId: uuid('job_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('credit_ledger_user_idx').on(table.userId),
  ]
);

// ----------------- Relations -----------------
export const userRelations = relations(user, ({ many }) => ({
  projects: many(projects),
  assets: many(assets),
  jobs: many(generationJobs),
  copyGenerations: many(copyGenerations),
  creditLedger: many(creditLedger),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(user, {
    fields: [projects.userId],
    references: [user.id],
  }),
  assets: many(assets),
  jobs: many(generationJobs),
  copyGenerations: many(copyGenerations),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  project: one(projects, {
    fields: [assets.projectId],
    references: [projects.id],
  }),
  user: one(user, {
    fields: [assets.userId],
    references: [user.id],
  }),
  parentAsset: one(assets, {
    fields: [assets.parentAssetId],
    references: [assets.id],
    relationName: 'lineage',
  }),
  childAssets: many(assets, {
    relationName: 'lineage',
  }),
}));

export const generationJobsRelations = relations(generationJobs, ({ one }) => ({
  project: one(projects, {
    fields: [generationJobs.projectId],
    references: [projects.id],
  }),
  sourceAsset: one(assets, {
    fields: [generationJobs.sourceAssetId],
    references: [assets.id],
  }),
  user: one(user, {
    fields: [generationJobs.userId],
    references: [user.id],
  }),
}));

export const copyGenerationsRelations = relations(copyGenerations, ({ one }) => ({
  project: one(projects, {
    fields: [copyGenerations.projectId],
    references: [projects.id],
  }),
  user: one(user, {
    fields: [copyGenerations.userId],
    references: [user.id],
  }),
}));

export const creditLedgerRelations = relations(creditLedger, ({ one }) => ({
  user: one(user, {
    fields: [creditLedger.userId],
    references: [user.id],
  }),
}));
