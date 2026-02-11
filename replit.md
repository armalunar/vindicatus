# Vindicatus

## Overview

Vindicatus is a Portuguese-language web application providing support and protection resources for people experiencing psychological pressure, abuse, and threats. The name means "vindicated" in Latin. It features a public-facing informational website with sections for support, understanding abuse patterns, safety resources, and an "Expostos" (Exposed) blog section. There is also an admin panel for content management, including blog post creation and user/curator profile management.

## Recent Changes

- 2026-02-11: Initial Replit setup. Added `trust proxy` to Express for proper rate-limiting behind Replit's proxy. Added `crossOriginResourcePolicy: false` to Helmet for iframe compatibility. Added `Cache-Control: no-cache` to static file serving. Created `.gitignore`. Configured deployment as autoscale.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend
- **Runtime**: Node.js 20 with ES modules (`"type": "module"` in package.json)
- **Framework**: Express.js v4, entry point at `server/index.js`
- **Port**: 5000 on 0.0.0.0
- **Database**: SQLite via `better-sqlite3`, stored at `server/vindicatus.sqlite`
  - Three tables: `users`, `posts`, `post_images`
  - WAL mode enabled for better concurrent read performance
- **Authentication**: Dual-layer auth system
  - **Firebase Authentication** (client-side): Users sign in with email/password via Firebase Auth SDK loaded from CDN
  - **Server-side verification**: Firebase Admin SDK verifies ID tokens, then creates/syncs local user records in SQLite and establishes an Express session
  - Auto-provisioning: First user becomes "supreme" role, subsequent users get "curator" role
- **Security middleware**: Helmet (HTTP headers), express-rate-limit (trust proxy enabled), express-session

### API Routes
- **`/api/admin/*`** (`server/routes/admin.js`): Protected admin endpoints
- **`/api/*`** (`server/routes/public.js`): Public read endpoints (curators, posts)
- **`/api/contact`** (`server/routes/contact.js`): Contact form via Discord webhook

### Frontend
- **Public site**: Static HTML/CSS/JS served from `public/` directory
- **Admin panel**: Static pages under `public/admin/` with Firebase auth and Quill.js editor

## External Dependencies

### Services
- **Firebase** (project: `vindicatus-ce514`): Authentication
- **Discord Webhook**: Contact form delivery via `CONTACT_WEBHOOK_URL` env var

### Environment Variables
- `SESSION_SECRET` — Express session secret (falls back to `"dev_secret"`)
- `CONTACT_WEBHOOK_URL` — Discord webhook URL for contact form delivery

### Key NPM Packages
- `express`, `better-sqlite3`, `firebase-admin`, `helmet`, `express-rate-limit`, `express-session`, `dotenv`, `multer`

### CDN Dependencies (Frontend)
- Firebase JS SDK v10.12.5
- Quill.js v1.3.7 (admin panel rich text editor)
