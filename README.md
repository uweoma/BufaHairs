# BufaHairs — Premium Hair E‑Commerce

![License](https://img.shields.io/badge/license-MIT-5B21B6.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)

A full‑stack, production‑ready e‑commerce platform for a premium human‑hair / wig brand. Real backend, real database, real authentication, real Paystack payments, a complete admin dashboard, transactional email, and a mobile‑first storefront in an elegant purple aesthetic.

> **Brand note:** "BufaHairs", its logo copy, product imagery and prices are placeholders chosen to make the app runnable end‑to‑end. Swap them for real assets via environment variables and the admin dashboard — no code changes required to re‑skin (`NEXT_PUBLIC_BRAND_NAME`).

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Quick start (Docker)](#quick-start-docker)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Database & seed](#database--seed)
- [Payments (Paystack)](#payments-paystack)
- [Optional integrations](#optional-integrations)
- [API overview](#api-overview)
- [Scripts](#scripts)
- [Testing](#testing)
- [Conventions](#conventions)
- [Security](#security)
- [Deployment](#deployment)

---

## Features

**Storefront**
- Homepage with featured / best‑seller / new‑arrival rails
- Catalog (`/shop`) with search, category / texture / price / length filters, sorting and pagination
- Product detail with image gallery, variants (length · colour · density · cap size), stock awareness, related products, and verified‑purchaser reviews
- Cart (guest cart in `localStorage`, merged into the account on login) and wishlist
- Authenticated checkout → Paystack → order confirmation, with server‑side payment verification
- Customer account: profile, order history + detail (pay / cancel), saved addresses, in‑app notifications
- Auth: register, login, forgot / reset password, email verification
- SEO: dynamic `sitemap.xml`, `robots.txt`, PWA `manifest`, per‑product OpenGraph + JSON‑LD
- Polish: skeleton loading, toasts, empty / error states, responsive from 320px up, floating WhatsApp button (env‑driven)

**Admin dashboard** (`/admin`, role‑gated)
- Overview (revenue, orders, customers, low‑stock) and time‑series analytics
- Orders: lifecycle state machine, tracking numbers, internal notes, status emails
- Products: full CRUD with Cloudinary image upload and variant management
- Customers: list, detail, enable / disable
- Coupons: CRUD (percentage / fixed, min spend, caps, usage & per‑user limits, scheduling, scope)
- Reviews: moderation (approve / hide / delete)

---

## Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI primitives, TanStack Query, React Hook Form + Zod, Lucide icons, Sonner toasts |
| Backend    | Node.js, Express, TypeScript |
| Database   | PostgreSQL 16 + Prisma ORM |
| Auth       | JWT access tokens + rotating refresh tokens (httpOnly cookie), bcrypt, role‑based (`CUSTOMER` / `ADMIN`) |
| Payments   | Paystack (server‑side initialize + verify, signed webhooks) |
| Media      | Cloudinary (optional) |
| Email      | Resend (optional) |
| Infra      | Docker + docker‑compose |
| Tests      | Vitest (+ supertest) |

---

## Repository layout

```
.
├── backend/            Express + Prisma REST API
│   ├── prisma/         schema.prisma, migrations/, seed.ts
│   ├── src/
│   │   ├── config/     env, prisma, logger, cookies, cloudinary
│   │   ├── controllers/  routes/  services/  serializers/
│   │   ├── middleware/  validators/  utils/
│   │   └── app.ts  server.ts
│   ├── tests/          Vitest unit tests
│   └── Dockerfile
├── frontend/           Next.js App Router storefront + admin
│   ├── src/app/        routes (storefront, account, admin, sitemap/robots/manifest)
│   ├── src/components/  src/hooks/  src/lib/
│   └── Dockerfile
├── docker-compose.yml  Postgres + backend + frontend
└── .env.example        root reference for compose
```

---

## Quick start (Docker)

The fastest way to run the whole stack. Requires Docker Desktop.

```bash
cp .env.example .env
docker compose up --build
```

This starts **Postgres**, the **backend** (`http://localhost:4000/api`) and the **frontend** (`http://localhost:3000`). Database migrations are applied automatically on backend startup.

Seed demo data (19 products, categories, shipping zones, coupons and demo users) once the stack is healthy:

```bash
docker compose exec backend npm run db:seed
```

Then open **http://localhost:3000**.

> The default `.env` uses safe development fallbacks so it boots out of the box. Paystack / Cloudinary / Resend are left blank — those features degrade gracefully (see below). Set real values before deploying.

---

## Local development

Run the two services directly (Node 20+ and a local or Dockerised PostgreSQL).

### 1. Database

Start just Postgres via compose (or use your own instance):

```bash
docker compose up -d postgres
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env          # then set DATABASE_URL + JWT secrets
npm run prisma:migrate        # create the schema
npm run db:seed               # load demo data
npm run dev                   # http://localhost:4000  (tsx watch)
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local    # points at http://localhost:4000/api by default
npm run dev                   # http://localhost:3000
```

**Demo logins** (created by the seed):

| Role     | Email                    | Password      |
|----------|--------------------------|---------------|
| Admin    | `admin@bufahairs.com`    | `Admin123!`   |
| Customer | `customer@bufahairs.com` | `Password123` |

---

## Environment variables

Full references live in [`.env.example`](.env.example) (root, for compose), [`backend/.env.example`](backend/.env.example), and [`frontend/.env.example`](frontend/.env.example). Highlights:

### Backend

| Variable | Required | Notes |
|----------|:--------:|-------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ✅ | Long random strings — `openssl rand -base64 48`. Production refuses to boot with the dev defaults. |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | – | Defaults `15m` / `7d` |
| `CLIENT_URL` / `CORS_ORIGINS` / `COOKIE_DOMAIN` | – | Cookie + CORS config |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | – | Enables real payments when set |
| `CLOUDINARY_*` | – | Enables admin image uploads when all three are set |
| `RESEND_API_KEY` / `EMAIL_FROM` | – | Enables transactional email when set |

### Frontend (all public, `NEXT_PUBLIC_*`)

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Backend base URL incl. `/api` |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (SEO / sitemap / OG) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Public key (safe to expose); blank is fine — checkout still works via redirect |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | International format, no `+`. Empty hides the button. |
| `NEXT_PUBLIC_BRAND_NAME` | Re‑skin the brand name without code changes |

> **Never commit real secrets.** `.env` / `.env.local` are git‑ignored; only the `.env.example` templates are tracked.

---

## Database & seed

- Schema is defined in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma); migrations live in `backend/prisma/migrations/`.
- `npm run prisma:migrate` — create/apply a dev migration. `npm run prisma:deploy` — apply migrations non‑interactively (used by the Docker entrypoint).
- `npm run db:seed` — idempotent seed (upserts): categories, **19 products** with variants and images, shipping zones, sample coupons, and the two demo users.
- `npm run prisma:studio` — browse data in Prisma Studio.
- Products use a soft delete (`deletedAt`); a product with order history is deactivated rather than hard‑deleted.

---

## Payments (Paystack)

Payments are **fully server‑authoritative** — the frontend is never trusted to report payment status.

1. `POST /api/orders` creates the order (reserving stock) and returns a Paystack `authorizationUrl`.
2. The browser is redirected to Paystack to pay.
3. On return, the backend **verifies** the transaction server‑side (`POST /api/payments/verify`) before marking the order paid.
4. A signed **webhook** (`POST /api/payments/webhook`) provides the authoritative confirmation. The raw body is HMAC‑SHA512‑verified against `x-paystack-signature`; fulfilment is idempotent so a duplicated webhook + verify can never double‑process.

Set `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` from your Paystack test dashboard, and point a webhook at `…/api/payments/webhook` (use a tunnel such as ngrok in local dev).

**Without Paystack keys** (local dev only): payments are reported as disabled, and a guarded endpoint `POST /api/payments/dev/complete` can simulate a successful payment so the order flow is testable. This route is mounted **only** when `NODE_ENV !== production` **and** Paystack is not configured — it can never fake a payment in production.

---

## Optional integrations

All three degrade gracefully and log a warning when unconfigured — the app stays runnable.

- **Cloudinary** — admin product image uploads. When unset, the upload endpoint returns `503` (it never fabricates image URLs). Seed products use remote demo images (allow‑listed in `next.config`).
- **Resend** — transactional email (order confirmations, status updates, password reset). When unset, emails are logged instead of sent.

---

## API overview

Base path: `/api`. All responses use the envelope `{ success, message, data, meta? }`.

| Group | Routes |
|-------|--------|
| Health | `GET /health` (liveness + DB readiness) |
| Auth | `/auth` — register, login, refresh, logout, verify email, forgot / reset password |
| Catalog | `/products`, `/categories` |
| Cart / Wishlist | `/cart`, `/wishlist` |
| Shipping | `/shipping` — zones + quote |
| Coupons | `/coupons/validate` |
| Addresses | `/addresses` — CRUD + default |
| Orders | `/orders` — create, list, get, cancel |
| Payments | `/payments` — initialize, verify, webhook, dev‑complete |
| Reviews | `/reviews` — public list + summary; authenticated create / update / delete (verified purchasers) |
| Notifications | `/notifications` |
| Newsletter | `/newsletter` |
| Admin | `/admin` — overview, analytics, orders, customers, products, coupons, reviews, uploads (all `ADMIN`‑only) |

---

## Scripts

**Backend** (`cd backend`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server with hot reload (tsx watch) |
| `npm run build` | `prisma generate` + `tsc` → `dist/` |
| `npm start` | Run compiled server |
| `npm run prisma:migrate` / `prisma:deploy` | Apply migrations |
| `npm run db:seed` / `db:reset` | Seed / reset the database |
| `npm test` / `test:watch` | Run the Vitest suite |
| `npm run typecheck` / `lint` / `format` | Static checks |

**Frontend** (`cd frontend`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Next dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run typecheck` / `lint` | Static checks |

---

## Testing

The backend ships a Vitest unit suite covering the pure business logic that must not regress — money conversion (kobo), pricing / variant resolution, slugging, order‑number and token generation, duration parsing, the **Paystack webhook signature verifier**, and the **backend‑authoritative coupon engine** (discount math + every guard rail) via an injected mock client (no DB required):

```bash
cd backend && npm test
```

The frontend is verified via `npm run build`, `npm run typecheck` and `npm run lint`.

---

## Conventions

- **Money is stored and transported as integer kobo** (NGN minor units) everywhere — including Paystack. Never do arithmetic on naira floats; convert only at the UI edge (`formatNaira`, `nairaToKobo`, `koboToNaira`).
- **API envelope**: `{ success, message, data, meta? }` on success; `{ success, message, errors? }` on error.
- **Auth**: JWT access token via `Authorization: Bearer`; rotating refresh token in an httpOnly cookie scoped to `/api/auth`. The frontend `http` client transparently single‑flight‑refreshes on `401`.

---

## Security

- Secrets (password hashes, JWT secrets, Paystack secret key, DB credentials) are never returned by the API and never logged; stack traces are not exposed to clients.
- Payments are verified server‑side; webhooks are signature‑verified and idempotent; the frontend is never trusted for payment status.
- `helmet`, a CORS allow‑list, rate limiting, input validation (Zod) and payload sanitisation are enabled.
- Passwords are hashed with bcrypt; refresh tokens are stored hashed at rest.
- Admin routes are protected by authentication **and** `ADMIN` role authorization.
- `.env` files are git‑ignored; production refuses to start with default/empty JWT secrets.

---

## Deployment

- Build images with `docker compose build` (both services have multi‑stage, non‑root Dockerfiles; the frontend uses Next.js `standalone` output).
- Provide production `DATABASE_URL`, strong `JWT_*` secrets, live `PAYSTACK_*` keys, and the `NEXT_PUBLIC_*` values at build time for the frontend.
- The backend container runs `prisma migrate deploy` on startup, then serves on port `4000`; the frontend serves on `3000`.
- Point the Paystack webhook at `https://your-api-domain/api/payments/webhook`.
