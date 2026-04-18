# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Teklin is an AI-powered technical English learning app for software engineers. "Learn technical English like you code" — 5 min/day with AI. Target: engineers at TOEIC 600+ who struggle with technical writing (PR comments, commit messages, Slack, GitHub Issues).

## Tech Stack

- **Frontend**: React 19 + Vite + React Router 7 + Tailwind CSS 4 (SPA)
- **Backend**: Hono 4 on Cloudflare Workers (API + static asset serving)
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare KV (SESSION_KV, SRS_KV, STREAK_KV, USAGE_KV)
- **Storage**: Cloudflare R2 (CONTENT_BUCKET for audio/images/content JSON)
- **LLM**: Cloudflare AI Gateway (Workers AI + GPT-4.1/Claude via gateway)
- **Shared types**: `@teklin/shared` package (pure TypeScript, no runtime deps)
- **Monorepo**: NPM workspaces (`apps/*`, `packages/*`) — no Turborepo

## Commands

```bash
# Development
npm run dev          # Run both web and api dev servers
npm run dev:web      # Vite dev (port 3000, proxies /api and /auth to :8787)
npm run dev:api      # Wrangler dev server (port 8787)

# Build
npm run build        # Build web then api
npm run build:web    # Vite build → apps/web/dist/
npm run build:api    # Wrangler dry-run build to dist/

# Quality
npm run lint         # ESLint across all workspaces
npm run format       # Prettier format
npm run format:check # Prettier check only
npm run typecheck    # TypeScript --noEmit across all workspaces

# Deploy
npm run deploy       # Build web + wrangler deploy (single Worker)
```

## Architecture

### Monorepo Layout

- `apps/web/` — React SPA (Vite + React Router, `@teklin/web`)
- `apps/api/` — Hono API on Cloudflare Workers (`@teklin/api`)
- `packages/shared/` — Domain types and enums (`@teklin/shared`)

### Single Worker Deployment

The app deploys as a single Cloudflare Worker:
- Hono handles `/api/*` and `/auth/*` routes
- Cloudflare Workers Static Assets serves the SPA from `apps/web/dist/`
- `not_found_handling = "single-page-application"` enables SPA fallback to index.html
- Same origin — no CORS needed

### API Bindings (wrangler.toml)

The Hono app is typed with Cloudflare bindings accessed via `c.env`:
- `DB` — D1Database
- `SESSION_KV`, `SRS_KV`, `STREAK_KV`, `USAGE_KV` — KVNamespace
- `CONTENT_BUCKET` — R2Bucket
- `AI` — Cloudflare Workers AI binding
- `ASSETS` — Fetcher (static asset binding)

### Shared Domain Types

`packages/shared/src/index.ts` exports core enums and types used by both apps:
- `Level` (L1–L4), `Domain` (web/infra/ml/mobile), `SkillAxis` (reading/writing/vocabulary/nuance)
- `RewriteContext`, `SRSQuality`, `CardCategory` — domain-specific types

### Web App

- Uses `src/` directory with `@/*` path alias → `./src/*`
- Tailwind CSS 4 via `@tailwindcss/vite` plugin
- Client-side routing via React Router
- All API calls use relative paths (`/api/...`, `/auth/...`)
- Dev server proxies `/api` and `/auth` to Wrangler on port 8787

## Code Style

- ESLint 9 flat config with TypeScript-ESLint
- Prettier: double quotes, semicolons, trailing commas (es5), 2-space indent, 80 char width
- Unused variables must be prefixed with underscore (`_`)
- All TypeScript in strict mode
- Hono JSX uses `react-jsx` with `hono/jsx` as JSX import source (not React)
