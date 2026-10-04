# ShopShot AI (Shotsmith)

> Turn one plain product photo into ready-to-publish marketing images and copy with generative AI.

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.0-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Neon Postgres](https://img.shields.io/badge/Neon-Postgres-00E599?logo=postgresql&logoColor=white)](https://neon.tech)
[![Inngest](https://img.shields.io/badge/Inngest-Durable_Jobs-000000?logo=inngest&logoColor=white)](https://inngest.com)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.1-blue)](https://better-auth.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## Live Demo & Credentials

- **Live URL**: [https://shotsmith.vercel.app](https://shotsmith.vercel.app)
- **Demo Account**: `demo@shopshot.dev`
- **Demo Password**: `demo123456`
- **Sign-up Grant**: 30 Free Credits (auto-topped up to 30 nightly via Inngest cron)

---

## Features

1. **AI Background Removal (1 Credit)**:
   - Powered by Sub-pixel BiRefNet (`fal-ai/birefnet`).
   - One-click transparent cut-out PNG generation with zero manual rotoscoping.
2. **Curated Scene Generation (4 Credits)**:
   - Places products into photorealistic commercial environments while keeping geometry, labels, and logos unchanged.
   - 5 Tested presets: *Carrara Marble Countertop*, *Rustic Wooden Table*, *Tropical Beach*, *Studio Gradient*, and *Festive Holiday*.
   - Generates up to 4 distinct variations per run.
3. **Magic Inpainting & Edit (1 Credit)**:
   - Interactive canvas mask brush with brush/eraser sizing, undo (`Ctrl+Z`), and clear.
   - High-fidelity inpainting via Google Gemini & Fal FLUX image models.
4. **AI Super-Resolution (2 Credits)**:
   - 2× and 4× super-resolution upscaling for crystal-clear catalog and print quality.
5. **Multilingual Ad Copywriter (1 Credit)**:
   - Generates title, product description, 5 bullet points, social caption, and 10 targeted hashtags.
   - 4 Brand tones (*Professional*, *Playful*, *Luxury*, *Minimal*) and 6 languages (*English*, *Italian*, *Hindi*, *Spanish*, *German*, *French*).
   - Gemini Vision auto-describe feature to automatically identify products for free.
6. **Marketplace Export Bundler (Free, 0 Credits)**:
   - Sharp-powered batch resizing into standard marketplace dimensions:
     - **Instagram Post**: 1080 × 1080
     - **Instagram Story**: 1080 × 1920
     - **Amazon Main**: 2000 × 2000 (compliant pure white `#ffffff` background, product filling 85%)
     - **Shopify Card**: 2048 × 2048
     - **Web Banner**: 1920 × 600
   - Multi-select assets and download as an organized ZIP bundle.

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Browser Client (Nuxt 4 / Vue 3)                 │
│   • Interactive Canvas (Pan, Zoom, Checkerboard, Before/After Slider)  │
│   • Studio Mask Brush & Tool Panel • Gallery Multi-Select Export       │
└───────────────┬────────────────────────────┬───────────────────────────┘
                │ Direct Uploads             │ API Requests
                ▼                            ▼
      ┌──────────────────┐         ┌──────────────────────────────┐
      │   Vercel Blob    │         │   Nuxt 4 Nitro Server Routes │
      │   Cloud Storage  │         │   (Node.js Serverless)       │
      └──────────────────┘         └──────────────┬───────────────┘
                                                  │
                 ┌────────────────────────────────┼────────────────────────────────┐
                 ▼                                ▼                                ▼
      ┌──────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
      │     Neon Postgres    │        │    Credit Ledger     │        │     Upstash Redis    │
      │   Drizzle ORM Schema │        │   Transactional Debit│        │   Rate Limiting      │
      │   (Projects, Assets, │        │   & Auto-Refund on   │        │   (Jobs, Copy, Auth) │
      │    Jobs, Copy)       │        │   Failure            │        └──────────────────────┘
      └──────────────────────┘        └──────────────────────┘
                                                  │ Dispatches
                                                  ▼
                                      ┌──────────────────────┐
                                      │   Inngest Workflow   │
                                      │   Durable Step Queue │
                                      └───────────┬──────────┘
                                                  │
                                 ┌────────────────┴────────────────┐
                                 ▼                                 ▼
                      ┌──────────────────────┐          ┌──────────────────────┐
                      │    fal.ai Engine     │          │    Google Gemini     │
                      │  • BiRefNet Cut-out  │          │  • Imagen / GenAI    │
                      │  • ESRGAN Upscaler   │          │  • Multimodal Vision │
                      │  • FLUX Inpainting   │          │  • Structured Copy   │
                      └──────────────────────┘          └──────────────────────┘
```

---

## Local Development

### Prerequisites
- Node.js >= 20.x
- pnpm >= 10.x

### Setup Steps
1. **Clone repository and install dependencies**:
   ```powershell
   pnpm install
   ```
2. **Configure environment**:
   ```powershell
   Copy-Item .env.example .env
   ```
   *(By default `AI_MOCK=1` runs fully offline with zero paid API keys required).*

3. **Run database migrations and seed**:
   ```powershell
   pnpm db:migrate
   pnpm db:seed
   ```

4. **Start local servers**:
   ```powershell
   # Terminal 1: Inngest Dev Server
   pnpm dev:inngest

   # Terminal 2: Web Application
   pnpm dev
   ```

5. Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Testing & Quality Assurance

```powershell
# Run Vitest test suites across all packages
pnpm test

# Run Typecheck across monorepo
pnpm typecheck

# Build Nuxt 4 production bundle
pnpm --filter web build
```

---

## Build Phases Status
- [x] **Phase 1: Foundation** (Monorepo, Nuxt 4, Tailwind CSS, Neon Postgres + Drizzle ORM, Better Auth, Credit Ledger, Dark Mode)
- [x] **Phase 2: Projects & Uploads** (Projects CRUD, Vercel Blob client uploads, Studio Canvas with Pan/Zoom & Before/After Compare, Gallery)
- [x] **Phase 3: Job Engine & Background Removal** (Inngest serverless jobs, fal.ai adapter, BiRefNet background cut-outs, credit charge & refund)
- [x] **Phase 4: Scenes, Magic Edit & Upscale** (Gemini adapter, 5 scene presets, 4 variations, magic edit inpainting, 2×/4× super-resolution)
- [x] **Phase 5: Copywriting & Exports** (Multilingual ad copy generator, Gemini vision auto-describe, Sharp marketplace exports, ZIP bundler)
- [x] **Phase 6: Polish & Launch** (High-converting landing page, Upstash rate limits, security headers & CSP, nightly demo account cron, Playwright tests)
