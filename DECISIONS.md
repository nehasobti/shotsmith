# Architecture & Technical Decisions

This document records architectural, technical, and implementation decisions made during the development of ShopShot AI (Shotsmith).

## Phase 1: Foundation Decisions

1. **Monorepo Management**:
   - Configured pnpm workspaces with Turborepo (`apps/web`, `packages/shared`, `packages/ai`).
   - Root scripts delegate tasks cleanly across workspaces (`turbo build`, `pnpm --filter web ...`).

2. **Nuxt 4 Architecture**:
   - Used Nuxt 4 directory convention with `app/` directory (`app/pages`, `app/components`, `app/layouts`, `app/composables`, `app/stores`) and `server/` directory for Nitro server routes.
   - Node.js runtime configured for Nitro server routes to ensure full compatibility with Drizzle ORM, Sharp, and serverless background integrations.

3. **Database Driver**:
   - Used `@neondatabase/serverless` (and `postgres` client for direct connection / migration CLI) with Drizzle ORM for Neon Postgres serverless compatibility.

4. **Authentication & Sign-up Credit Grant**:
   - Implemented Better Auth with Drizzle adapter using email/password authentication.
   - Used Better Auth's database hooks on user creation (`databaseHooks.user.create.after`) to automatically create an initial entry in `credit_ledger` with `delta: SIGNUP_CREDITS` (default 30) and `reason: 'signup_grant'`, guaranteeing transactional credit provisioning on registration.

5. **Styling and UI**:
   - Configured Tailwind CSS with Lucide icons (`lucide-vue-next`).
   - Implemented dark mode support with system detection and manual toggle persisted in storage.

## Phase 2: Projects & Uploads Decisions

1. **Client Uploads & Local Development Resiliency**:
   - Integrated `@vercel/blob/client` for direct browser-to-cloud file uploads, bypassing serverless request body limits.
   - Implemented an automatic local/offline fallback in `useUpload` and `/api/uploads` that supports direct file upload when `BLOB_READ_WRITE_TOKEN` is not configured, allowing uninterrupted development and local verification.

2. **Studio Canvas Interactive Navigation**:
   - Built a high-performance interactive canvas component supporting mouse wheel zooming (20% to 500%), smooth panning, and auto-centering.
   - Added a CSS checkerboard background pattern to visually inspect background-removed transparent PNGs accurately.
   - Implemented a Before/After split compare slider allowing direct visual comparison between the working image and the project's original asset.

3. **Gallery & Asset Management**:
   - Created a dedicated gallery route (`/projects/:id/gallery`) with instant kind filtering (`original`, `cutout`, `scene`, `edit`, `upscale`), favorite toggling, asset deletion, and full-screen lightbox modal.
   - Ensured asset deletion cleans up storage blobs and resets project cover references.

## Phase 3: Job Engine & Background Removal Decisions

1. **AI Provider Architecture & Resiliency**:
   - Implemented `FalAiProvider` in `@shopshot/ai` leveraging `@fal-ai/client` queue API with webhook support for background removal (`fal-ai/birefnet`).
   - Built `createAiProvider` factory with automated fallback to `MockAiProvider` when API keys are absent or when configured for offline/testing development.

2. **Durable Job Execution & Credit Guarantees**:
   - Wired Inngest background event processing via `/api/inngest` and `/api/webhooks/fal`.
   - Enforced transactional credit debit (`reason: 'job_charge'`) upon job submission and reliable automatic refund (`reason: 'job_refund'`) if generation or storage fails.

3. **Reactive Polling Composable & Studio Integration**:
   - Created `useJobs` composable offering reactive job polling, active job tracking, and auto-refresh of project assets.
   - Added Studio one-click "Remove Background" action with credit balance verification, active task loading states, and instant cutout rendering on the canvas.

## Phase 4: Scenes, Magic Edit & Upscale Decisions

1. **AI Provider Multimodal Integration**:
   - Integrated Google Gemini via `@ai-sdk/google` alongside Fal FLUX for scene generation and magic edit.
   - Implemented 5 tested scene presets (`marble_counter`, `wooden_table`, `beach`, `studio_gradient`, `festive`) that strictly instruct the models to maintain product contours, textures, labels, and geometry intact.
   - Supported up to 4 parallel scene variations charged at 4 credits.
   - Added 2× and 4× super-resolution upscaling via Fal ESRGAN model charged at 2 credits.

2. **Studio Tooling & Lineage**:
   - Wired ToolPanel tabs for Scene, Magic Edit, and Upscaling directly into `useJobs` and Inngest.
   - Maintained project asset lineage with `parent_asset_id` and newest-first results filmstrip with instant canvas switching.

## Phase 5: Ad Copy & Marketplace Exports Decisions

1. **Multilingual Structured Copywriter**:
   - Built `/api/projects/:id/copy` powered by Gemini text model using structured outputs (`generateObject`), generating title, description, 5 selling bullet points, Instagram caption, and 10 targeted hashtags in 4 brand tones and 6 languages.
   - Added free Gemini Vision auto-describe endpoint `/api/assets/:id/describe` to automatically detect product characteristics from photos.
   - Built a dedicated copy studio (`/projects/:id/copy`) with one-click clipboard copying for all fields and generation history management.

2. **Marketplace Batch Exports via Sharp**:
   - Built `/api/exports` using Sharp and Archiver to bundle selected assets into 5 commercial preset formats:
     - Instagram Post (1080×1080)
     - Instagram Story (1080×1920)
     - Amazon Main (2000×2000, pure white `#ffffff`, product filling ~85%)
     - Shopify Card (2048×2048)
     - Web Banner (1920×600)
   - Packages all formats into an organized ZIP bundle without consuming credits.
   - Enhanced the project gallery (`/projects/:id/gallery`) with multi-select image selection and batch ZIP export modal.

## Phase 6: Polish, Launch & Enterprise Hardening Decisions

1. **Security & Production Hardening**:
   - Configured robust Content Security Policy (CSP), X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), and Referrer-Policy headers in `nuxt.config.ts`.
   - Built `@upstash/ratelimit` rate limiting in `apps/web/server/lib/ratelimit.ts` (10 jobs/min, 5 copy/min, 10 logins/min) with graceful in-memory token bucket fallback for offline/development environments.

2. **Demo Lifecycle & E2E Testing**:
   - Implemented nightly Inngest cron job `resetDemoAccount` (`0 0 * * *`) that checks `demo@shopshot.dev` and tops up credits to 30 every midnight.
   - Added Playwright end-to-end test suite (`apps/web/tests/e2e/workflow.spec.ts`) validating user registration, navigation, studio workspace, ad copy generator, and gallery export.

