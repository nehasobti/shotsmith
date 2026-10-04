<USER_REQUEST>
We wor on new roject 
Shotsmith
E:\Workspace\tychon\shotsmith
ShopShot AI – Technical Specification
Oct 2, 2026 · @Anshuman
Instructions for the AI coding agent
Build this project phase by phase (see Build phases), finishing and verifying each phase before starting the next. Treat this document as the source of truth.
• Write all code in TypeScript with strict mode on. Do not use any unless it can't be avoided.
• When you change a file, output the whole file with its path, never a partial diff.
• Do not add libraries beyond those listed here without stating why.
• If something is unclear, choose the simplest option that fits this spec, note it in DECISIONS.md, and keep going.
• Give commands for Windows PowerShell.
• Never hard-code secrets. Read everything from environment variables listed in .env.example.
• Stop at the end of each phase and wait for confirmation.
Assumptions behind this spec:
• Working name is ShopShot AI. It can be renamed freely.
• Same base stack as AgentLoom (Nuxt 4, Better Auth, Drizzle, Inngest) so the patterns are familiar. This app's focus is generative AI for images and copy.
• Production hosting is Vercel only. Local development uses free cloud services, no Docker.
• AI model names change often. Use the current best model from each provider at build time and keep model ids in one config file.
Product overview
ShopShot AI turns one plain product photo into ready-to-publish marketing images and copy. It is a portfolio app aimed at e-commerce clients, showing image generation, image editing and AI copywriting in one polished product.
Core user stories:
1. A user uploads a product photo (JPG, PNG or WebP, up to 10 MB) into a project.
2. A user removes the background in one click and gets a clean transparent cut-out.
3. A user places the product into a new scene, from a preset (marble counter, wooden table, beach, studio gradient, festive) or a custom prompt, and gets 4 variations. The product itself must stay unchanged.
4. A user paints over part of an image and describes a change ("remove the cable", "add a coffee cup") to edit just that area.
5. A user upscales an image 2× or 4×.
6. A user generates ad copy (title, description, 5 bullet points, Instagram caption, hashtags) in a chosen tone and language.
7. A user exports selected images in marketplace sizes (Instagram, Story, Amazon, Shopify) as a ZIP.
8. A user sees all generations in a gallery with before/after compare, and tracks remaining credits.
Out of scope: real payments (a Stripe test-mode credit purchase is an optional extra), teams, video generation, and a mobile app (the web app is responsive).
Tech stack
The stack is TypeScript end to end on Nuxt 4, with Google Gemini and fal.ai as the generative AI providers and Vercel Blob for image storage. Use the latest stable version of each library at the time you start.
Layer
Technology
Purpose
Framework
Nuxt 4 (Vue 3 + Nitro, Node.js runtime)
Full-stack app, one Vercel deployment
Frontend
Vue 3 Composition API, <script setup>, TypeScript
UI
State
Pinia + TanStack Query for Vue
App state, fetching, polling job status
UI
Tailwind CSS v4 + shadcn-vue + lucide-vue-next
Components and styling
Image editor
vue-konva (Konva)
Mask brush for magic edit, zoom and pan
Compare
Custom before/after slider component
Show original vs result
Upload
Vercel Blob client uploads (@vercel/blob)
Direct browser-to-storage uploads
Image processing
sharp
Resize, crop, pad, format conversion for exports
ZIP
archiver
Export bundles
Text AI
Vercel AI SDK + Google provider (Gemini text model)
Ad copy with structured output, image captioning
Image generation and editing
Gemini image model through the AI SDK Google provider
Scene generation, magic edit
Background removal and upscaling
fal.ai (@fal-ai/client) background-removal and upscaler models
Cut-outs and upscales, through the fal queue with webhooks
Fallback image model
fal.ai image-editing model (FLUX family)
Used if Gemini fails or for comparison
Database
Neon Postgres + Drizzle ORM + drizzle-kit
Data storage and migrations
Auth
Better Auth (Drizzle adapter), email/password + Google OAuth
Sessions and users
Jobs
Inngest (durable steps, step.waitForEvent)
Run generation jobs reliably on serverless
Rate limit
Upstash Redis + @upstash/ratelimit
Abuse protection
Validation
Zod
Shared schemas for client and server
Monorepo
pnpm workspaces + Turborepo
apps/web, packages/shared, packages/ai
Testing
Vitest + Playwright
Unit and end-to-end tests
CI and hosting
GitHub Actions, Vercel
Checks and deployment
Architecture
The browser talks only to Nuxt API routes, except for uploads, which go straight to Vercel Blob. Every image job is handed to Inngest, which calls back into Vercel step by step, so no request waits on a slow AI model.
Inngest functions also read and write Neon, and fal.ai returns results to the webhook route, which forwards them to the waiting job as an Inngest event.
Monorepo structure
The repo has one deployable Nuxt app and two shared packages. packages/ai wraps every AI provider behind one interface, so providers can be swapped and mocked in tests.
shopshot-ai/
├─ apps/
│  └─ web/                     # Nuxt 4 app (deployed to Vercel)
│     ├─ app/
│     │  ├─ pages/
│     │  ├─ components/
│     │  │  ├─ ui/             # shadcn-vue
│     │  │  ├─ studio/         # canvas, mask brush, tool panels
│     │  │  ├─ gallery/        # grid, compare slider, lightbox
│     │  │  └─ copy/           # ad copy editor
│     │  ├─ composables/
│     │  ├─ stores/
│     │  └─ layouts/
│     ├─ server/
│     │  ├─ api/
│     │  ├─ inngest/           # client + job functions
│     │  ├─ db/                # Drizzle schema, migrations, seed
│     │  └─ lib/               # auth, blob, credits, ratelimit, images (sharp)
│     ├─ tests/e2e/
│     └─ nuxt.config.ts
├─ packages/
│  ├─ shared/                  # Zod schemas, types, scene presets, export presets
│  └─ ai/                      # provider interface, Gemini + fal adapters, mock adapter, model config
├─ turbo.json
├─ pnpm-workspace.yaml
├─ .env.example
├─ .github/workflows/ci.yml
├─ DECISIONS.md
└─ README.md
Data model
The database has five app tables plus the Better Auth tables (user, session, account, verification). Use UUID primary keys and timestamptz. Every query filters by the logged-in user_id.
projects
Column
Type
Notes
id
uuid
PK
user_id
text
FK → user.id
name
varchar(120)
e.g. "Ceramic mug"
product_description
text
Optional, used for copy and prompts
cover_asset_id
uuid
Nullable, FK → assets.id
created_at, updated_at
timestamptz

assets (every image: originals and all results)
Column
Type
Notes
id
uuid
PK
project_id
uuid
FK → projects.id, cascade delete
user_id
text
FK → user.id
parent_asset_id
uuid
Nullable; the image it was made from (lineage)
job_id
uuid
Nullable, FK → generation_jobs.id
kind
enum: original, cutout, scene, edit, upscale, export

blob_url
text
Vercel Blob URL
blob_pathname
text
For deletes
width, height
integer

mime_type
varchar(50)

size_bytes
integer

is_favorite
boolean
Default false
created_at
timestamptz

generation_jobs
Column
Type
Notes
id
uuid
PK
user_id
text
FK → user.id
project_id
uuid
FK → projects.id
source_asset_id
uuid
FK → assets.id
type
enum: remove_bg, scene, edit, upscale

status
enum: queued, running, succeeded, failed

provider
enum: google, fal

model
varchar(100)

params
jsonb
Prompt, preset id, variation count, scale, mask URL
external_request_id
varchar(200)
fal queue request id
credits_charged
integer

cost_usd
numeric(10,6)
Estimated provider cost
error
text

started_at, finished_at
timestamptz

created_at
timestamptz

copy_generations
Column
Type
Notes
id
uuid
PK
project_id
uuid
FK → projects.id, cascade delete
user_id
text
FK → user.id
tone
enum: professional, playful, luxury, minimal

language
varchar(10)
e.g. en, it, hi
output
jsonb
{ title, description, bullets[], caption, hashtags[] }
tokens, cost_usd
integer, numeric(10,6)

created_at
timestamptz

credit_ledger
Column
Type
Notes
id
uuid
PK
user_id
text
FK → user.id
delta
integer
+grant / −spend / +refund
reason
enum: signup_grant, daily_grant, job_charge, job_refund, purchase

job_id
uuid
Nullable
created_at
timestamptz

Balance = sum of delta for the user. Add indexes on assets(project_id, created_at desc), generation_jobs(user_id, created_at desc), generation_jobs(external_request_id) and credit_ledger(user_id).
Generative AI pipeline
Every image operation is a generation_jobs row processed by one Inngest function, so slow models never block a Vercel request. Ad copy is the exception: it is fast enough to run directly in an API route.
Job flow
1. The API checks credits, deducts them (job_charge in the ledger), creates the job with status queued, and sends the Inngest event image/job.requested.
2. The Inngest function processImageJob marks it running and calls the provider adapter from packages/ai.
3. Gemini jobs (scene, edit) run inside step.run: send the source image plus prompt, receive image bytes, upload to Vercel Blob, create assets rows.
4. fal jobs (remove background, upscale) submit to the fal queue with a webhook URL, then wait with step.waitForEvent("fal/result", { timeout: "10m" }). The webhook route /api/webhooks/fal verifies the request and sends that event. The function then downloads the result into Vercel Blob.
5. On success the job becomes succeeded. On failure it becomes failed, the error is stored and the credits are refunded (job_refund).
6. The UI polls GET /api/jobs/:id every 2 seconds until the job finishes. Retries: 2 per step. Concurrency: 3 jobs per user.
Features and models
Feature
Provider and model type
Input
Output
Credits
Remove background
fal.ai background-removal model
Original image
Transparent PNG cut-out
1
Scene generation
Gemini image model (fallback: fal FLUX editing model)
Cut-out + preset or prompt
4 variations, 1024 px
4 (1 per image)
Magic edit
Gemini image model
Image + mask PNG + instruction
1 edited image
1
Upscale
fal.ai upscaler model
Image + scale (2× or 4×)
Upscaled image
2
Ad copy
Gemini text model with generateObject
Product image + name + description + tone + language
Title, description, 5 bullets, caption, 10 hashtags
1
Auto-describe
Gemini text model (vision)
Original image
Suggested product name and description
Free
Prompting rules
• Scene presets live in packages/shared/presets.ts, each with an id, label, thumbnail and a tested prompt template.
• Every scene and edit prompt includes the instruction to keep the product's shape, label, text, colours and logo exactly as they are, changing only the surroundings or the masked area.
• Custom prompts are passed through a moderation check (Gemini safety settings) and capped at 500 characters.
• For magic edit, the mask is painted in the browser with vue-konva, exported as a black-and-white PNG at the image's real size, and uploaded to Blob before the job starts.
Exports (done with sharp in an API route, no AI, no credits)
Preset
Size (px)
Background
Instagram post
1080 × 1080
Keep
Instagram story
1080 × 1920
Keep, padded
Amazon main
2000 × 2000
Pure white, product fills 85%
Shopify
2048 × 2048
Keep
Web banner
1920 × 600
Keep, cropped
Selected images × selected presets are bundled into one ZIP, uploaded to Blob, and the user gets a download link.
API endpoints
All endpoints are Nuxt server routes under /api, require a session unless marked otherwise, validate input with Zod and return errors as { error: { code, message } }.
Method
Path
Purpose
Auth
ALL
/api/auth/[...all]
Better Auth handler
Public
GET, POST
/api/projects
List or create projects
Session
GET, PUT, DELETE
/api/projects/:id
Read, rename or delete a project (deletes its Blob files)
Session
POST
/api/uploads
Issue a Vercel Blob client-upload token; on completion create the original asset
Session
GET
/api/projects/:id/assets
List assets with lineage, filter by kind
Session
PATCH, DELETE
/api/assets/:id
Toggle favourite, delete
Session
POST
/api/assets/:id/describe
Auto-describe the product (free)
Session
POST
/api/jobs
Start a job: { type, sourceAssetId, params }
Session
GET
/api/jobs/:id
Job status and result assets (polled)
Session
GET
/api/projects/:id/jobs
Job history
Session
POST
/api/projects/:id/copy
Generate ad copy (runs directly, not a job)
Session
GET
/api/projects/:id/copy
List copy generations
Session
POST
/api/exports
Build a ZIP for { assetIds[], presetIds[] }, return the Blob URL
Session
GET
/api/presets
Scene and export presets
Session
GET
/api/credits
Balance and recent ledger entries
Session
POST
/api/webhooks/fal
fal.ai result webhook; verified, then sends an Inngest event
fal signature
GET, POST, PUT
/api/inngest
Inngest serve endpoint
Inngest signing key
Frontend pages and UX
The Studio page is the centrepiece: one image in the middle, tools on the left, results on the right. It must feel fast and visual.
Route
Page
Key contents
/
Landing
Hero with an animated before/after slider, 3-step "Upload → Generate → Export", sample gallery, "Try free" button
/login, /register
Auth
Email/password, "Continue with Google", demo login
/projects
Projects
Grid of project cards (cover image, name, image count), New project button with drag-and-drop upload
/projects/:id
Studio
Canvas, tool panel, results strip, job progress
/projects/:id/gallery
Gallery
All assets, filter by kind, favourites, multi-select, compare, export
/projects/:id/copy
Ad copy
Tone and language pickers, generated copy in editable cards with copy buttons, history
/settings
Settings
Profile, credit balance and history
Studio requirements
• Left tool panel with tabs: Remove background, Scene, Magic edit, Upscale. Each shows its credit cost on the button.
• Scene tab: preset cards with thumbnails, a custom prompt box, variation count (1–4).
• Magic edit tab: brush size slider, eraser, clear mask, undo; instruction box.
• Centre canvas: zoom, pan, checkerboard background for transparent images, before/after toggle.
• Right results strip: newest results first; clicking one loads it into the canvas as the new working image (lineage kept).
• Running jobs show a progress card with elapsed time and a shimmer placeholder for each expected image.
• Keyboard: B brush, E eraser, [/] brush size, Ctrl/Cmd+Z undo mask.
General UX
• Light and dark mode; toasts for job results and errors; skeleton loaders; friendly empty states.
• Credit balance always visible in the top bar; a dialog explains when credits run out.
• Responsive; on mobile the magic edit tab is hidden.
• Images use lazy loading and Blob URLs with width-based resizing where possible.
Credits, limits and security
Credits keep the public demo affordable: every image operation costs credits, and the balance is enforced on the server before any provider is called.
• Grants: 30 credits on sign-up; demo account topped up to 30 every night by an Inngest cron function. The amounts live in config.
• Charging: deduct when the job is created, refund automatically on failure, all inside a database transaction so the balance can't go negative.
• Rate limits (Upstash): 10 jobs per minute per user, 5 copy generations per minute per user, 10 logins per minute per IP.
• Uploads: only JPG, PNG and WebP, max 10 MB, max 4096 px on the longest side (larger images are resized with sharp). Blob upload tokens are scoped to the user's path users/<userId>/….
• Ownership: every asset, job and project access checks user_id on the server.
• Webhook: /api/webhooks/fal verifies fal's signature and matches external_request_id to a running job; unknown ids are ignored.
• Content safety: use provider safety settings; blocked results mark the job failed with a clear message and refund credits.
• Secrets: API keys only on the server; never sent to the browser or logged.
• Headers: CSP (allowing the Blob domain for images), X-Frame-Options, Referrer-Policy, X-Content-Type-Options.
• Optional extra: Stripe Checkout in test mode for credit packs, writing purchase rows to the ledger from the Stripe webhook.
Local development
Local development uses free cloud services and needs no Docker: Neon for the database, Upstash for Redis, Vercel Blob for files, and the Inngest dev server on your PC.
Need
Local setup
Database
Neon dev branch
Redis
Separate Upstash dev database
Files
Vercel Blob store (pull the token with vercel env pull)
Jobs
npx inngest-cli@latest dev (dashboard at http://localhost:8288)
AI
Your own Gemini and fal.ai keys, or AI_MOCK=1 to use the mock adapter with sample images
fal webhooks locally: fal can't reach localhost. When FAL_WEBHOOK_BASE_URL is empty, the job function polls fal's queue status instead (step.sleep 3 seconds between checks, max 10 minutes). Production always uses webhooks.
Commands (root package.json scripts, PowerShell):
1. pnpm install
2. Copy .env.example to .env and fill it in.
3. pnpm db:migrate then pnpm db:seed (demo user, one sample project with a product photo).
4. pnpm dev:inngest in one terminal, pnpm dev in another.
5. Open http://localhost:3000.
.env.example
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_GENERATIVE_AI_API_KEY=
FAL_KEY=
FAL_WEBHOOK_BASE_URL=          # empty locally
BLOB_READ_WRITE_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
INNGEST_DEV=1
INNGEST_EVENT_KEY=             # production only
INNGEST_SIGNING_KEY=           # production only
AI_MOCK=0
SIGNUP_CREDITS=30
DEMO_USER_EMAIL=demo@shopshot.dev
DEMO_USER_PASSWORD=
Deployment to Vercel
The app deploys as one Vercel project. Neon, Upstash, Inngest and Vercel Blob are added inside the Vercel project, so their environment variables are set automatically; only the AI and auth keys are added by hand.
1. Push the repo to GitHub and import it into Vercel. Root directory apps/web, framework preset Nuxt, build command pnpm turbo build --filter=web.
2. In the project's Storage tab, create a Blob store. From the Marketplace add Neon, Upstash Redis and Inngest.
3. Add by hand: BETTER_AUTH_SECRET, BETTER_AUTH_URL (production URL), GOOGLE_GENERATIVE_AI_API_KEY, FAL_KEY, FAL_WEBHOOK_BASE_URL (production URL), Google OAuth keys (optional), demo user values. Do not set INNGEST_DEV or AI_MOCK.
4. Migrations run in the vercel-build script (drizzle-kit migrate before nuxt build).
5. After the first deploy, confirm the app is synced in the Inngest dashboard at https://<domain>/api/inngest, then run the seed once.
6. Smoke test on production: log in as demo, remove a background, generate a scene, export a ZIP.
Vercel constraints to respect:
• No long-running work inside a request. All image jobs run through Inngest steps.
• Keep each step.run short; waiting for fal uses step.waitForEvent, never a loop inside one function call.
• Use the Node.js runtime for server routes (sharp, Drizzle and the AI SDK need it).
• Large images go browser → Blob directly through client uploads, never through a function body.
Testing and CI
Tests never call real AI providers: the mock adapter in packages/ai returns fixed sample images and copy. CI must pass before merging to main.
• Unit (Vitest): credit charging and refunds, prompt building from presets, export sizing maths, Zod schemas, provider adapter mapping. Target 80% line coverage on packages/shared and packages/ai.
• API (Vitest + @nuxt/test-utils): project CRUD, ownership isolation (user A can't read user B's assets), job creation rejects when credits are too low, fal webhook rejects bad signatures.
• End-to-end (Playwright, AI_MOCK=1): register → create project with an upload → remove background → generate a scene → generate ad copy → export a ZIP.
• GitHub Actions: install with cache → lint → typecheck → unit and API tests → Playwright against a Neon CI branch. Upload the Playwright report on failure.
• Vercel: preview deployment on every pull request; production deploy on merge to main.
Build phases and definition of done
Build in six phases, in order. Each ends with working code, passing tests and a successful Vercel deploy.
1. Foundation: monorepo, Nuxt app, Tailwind + shadcn-vue, Drizzle schema and migrations, Better Auth (email/password), layout, dark mode, CI, credit ledger with sign-up grant. Done when: a user registers, logs in and sees an empty projects page with 30 credits, locally and on Vercel.
2. Projects + uploads: projects CRUD, Vercel Blob client uploads, assets list, Studio layout with canvas (zoom, pan, checkerboard), gallery grid. Done when: a user creates a project, uploads a photo and sees it in the Studio and gallery.
3. Job engine + background removal: packages/ai with fal and mock adapters, Inngest setup, jobs API, fal webhook and local polling fallback, credit charge and refund, job polling UI. Done when: background removal works end to end and a failed job refunds credits.
4. Scenes + magic edit + upscale: Gemini adapter, scene presets, 4 variations, mask brush with vue-konva, upscale, results strip, before/after compare, lineage. Done when: all four image tools work from the Studio.
5. Copy + exports: auto-describe, ad copy page with tone and language, export presets with sharp, ZIP download. Done when: a user exports an Amazon-ready image set and copies generated listing text.
6. Polish + launch: landing page with sample before/after images, Google OAuth, demo account with nightly reset, rate limits, security headers, Playwright tests, README with architecture diagram, screenshots and a demo GIF. Done when: CI is green, the live demo works with the demo login, and Lighthouse is 90+ on the landing page.
The finished README must include: one-line pitch, live demo link with demo login, before/after examples, feature list, tech stack badges, architecture diagram, local setup and deployment steps.




</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-10-02T21:36:13+05:30.
</ADDITIONAL_METADATA>
<USER_SETTINGS_CHANGE>
The user changed setting `Model Selection` from None to Gemini 3.8 Flash (Medium). No need to comment on this change if the user doesn't ask about it. If reporting what model you are, please use a human readable name instead of the exact string.
</USER_SETTINGS_CHANGE>