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
