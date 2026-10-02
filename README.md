# ShopShot AI (Shotsmith)

> Turn one plain product photo into ready-to-publish marketing images and copy with generative AI.

## Overview
ShopShot AI is a production-grade e-commerce creative studio built with Nuxt 4, Vue 3, Drizzle ORM, Better Auth, and Inngest. It empowers e-commerce brands to remove backgrounds, generate contextual 3D scenes, perform precision magic inpainting, upscale imagery up to 4×, and generate high-converting multilingual marketing copy.

## Tech Stack
- **Framework**: Nuxt 4 (Vue 3 + Nitro Node.js runtime)
- **Database**: Neon Postgres + Drizzle ORM
- **Auth**: Better Auth (Drizzle adapter, Email/Password + Google OAuth)
- **Styling**: Tailwind CSS + Radix/shadcn-vue + Lucide Vue Next
- **AI Providers**: Google Gemini (scene generation, magic edit, copywriting) + fal.ai (background removal, upscaling)
- **Jobs & Queue**: Inngest serverless workflow engine
- **Storage**: Vercel Blob client uploads
- **Image Processing**: Sharp & Archiver (export bundles)
- **State**: Pinia + TanStack Query for Vue

## Architecture
```
Browser (Vue 3 / Nuxt 4)
  │─── Direct Client Upload ───────► Vercel Blob Storage
  │─── API Requests ───────────────► Nuxt Nitro Server Routes
                                      │─── Better Auth & Drizzle ──► Neon Postgres
                                      │─── Deduct / Refund ────────► Credit Ledger
                                      └─── Send Event ─────────────► Inngest Functions
                                                                      │── Gemini (Vision / GenAI)
                                                                      └── fal.ai (Queue & Webhooks)
```

## Local Development
1. Clone the repository and install dependencies:
   ```bash
   pnpm install
   ```
2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
3. Run migrations and database seed:
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```
4. Start Inngest local dev server and Nuxt:
   ```bash
   # Terminal 1: Inngest Dev Server
   pnpm dev:inngest

   # Terminal 2: Web Application
   pnpm dev
   ```
5. Open [http://localhost:3000](http://localhost:3000).

## Build Phases
- [x] **Phase 1: Foundation** (Monorepo, Nuxt 4, Tailwind, Drizzle, Better Auth, Credit Ledger, Layout, Dark Mode)
- [ ] **Phase 2: Projects & Uploads** (Projects CRUD, Vercel Blob client uploads, Studio Canvas)
- [ ] **Phase 3: Job Engine & Background Removal** (Inngest, fal.ai adapter, Credit charging & refunds)
- [ ] **Phase 4: Scenes, Magic Edit & Upscale** (Gemini adapter, presets, vue-konva mask brush, upscaling)
- [ ] **Phase 5: Copywriting & Exports** (Multilingual ad copy, Sharp marketplace exports, ZIP bundle)
- [ ] **Phase 6: Polish & Launch** (Landing page, rate limiting, security headers, E2E tests, production deploy)
