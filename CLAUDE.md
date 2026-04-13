# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Teklin is an AI-powered technical English learning app for software engineers. "Learn technical English like you code" — 5 min/day with AI. Target: engineers at TOEIC 600+ who struggle with technical writing (PR comments, commit messages, Slack, GitHub Issues).

## Tech Stack

- **Frontend**: Next.js 15 + React 19 + Tailwind CSS 4 → Cloudflare Pages
- **API**: Hono 4 on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite) — not yet implemented
- **Cache**: Cloudflare KV (SESSION_KV, SRS_KV, STREAK_KV)
- **Storage**: Cloudflare R2 (CONTENT_BUCKET for audio/images/content JSON)
- **LLM**: Cloudflare AI Gateway (Workers AI + GPT-4.1/Claude via gateway)
- **Shared types**: `@teklin/shared` package (pure TypeScript, no runtime deps)
- **Monorepo**: NPM workspaces (`apps/*`, `packages/*`) — no Turborepo

## Commands

```bash
# Development
npm run dev          # Run both web and api dev servers
npm run dev:web      # Next.js dev (Turbopack, port 3000)
npm run dev:api      # Wrangler dev server

# Build
npm run build        # Build all workspaces
npm run build:web    # Next.js standalone build (for Cloudflare Pages)
npm run build:api    # Wrangler dry-run build to dist/

# Quality
npm run lint         # ESLint across all workspaces
npm run format       # Prettier format
npm run format:check # Prettier check only
npm run typecheck    # TypeScript --noEmit across all workspaces

# Deploy
cd apps/api && npm run deploy  # wrangler deploy (Workers)
# Web deploys via Cloudflare Pages git integration
```

## Architecture

### Monorepo Layout

- `apps/web/` — Next.js 15 frontend (App Router, `@teklin/web`)
- `apps/api/` — Hono API on Cloudflare Workers (`@teklin/api`)
- `packages/shared/` — Domain types and enums (`@teklin/shared`)

### API Bindings (wrangler.toml)

The Hono app is typed with Cloudflare bindings accessed via `c.env`:
- `DB` — D1Database
- `SESSION_KV`, `SRS_KV`, `STREAK_KV` — KVNamespace
- `CONTENT_BUCKET` — R2Bucket
- `AI` — Cloudflare Workers AI binding

### Shared Domain Types

`packages/shared/src/index.ts` exports core enums and types used by both apps:
- `Level` (L1–L4), `Domain` (web/infra/ml/mobile), `SkillAxis` (reading/writing/vocabulary/nuance)
- `RewriteContext`, `SRSQuality`, `CardCategory` — domain-specific types

### Web App

- Uses `src/` directory with `@/*` path alias → `./src/*`
- Tailwind CSS 4 via `@tailwindcss/postcss`
- `output: "standalone"` in next.config.ts for Cloudflare Pages compatibility
- Uses `@opennextjs/cloudflare` adapter for deployment

## Code Style

- ESLint 9 flat config with TypeScript-ESLint
- Prettier: double quotes, semicolons, trailing commas (es5), 2-space indent, 80 char width
- Unused variables must be prefixed with underscore (`_`)
- All TypeScript in strict mode
- Hono JSX uses `react-jsx` with `hono/jsx` as JSX import source (not React)
