# Fairway Forward

> **Fairway Forward** is a golf performance, charity contribution, and monthly rewards platform built for Digital Heroes.  
> *Your game can make a difference.*

---

## 1. What is Fairway Forward?

Fairway Forward connects amateur golf performance with social impact and prize incentives. Golfers record their actual Stableford scores, contribute a portion of their subscription fee to verified charitable causes, and enter monthly prize draws based on their score performance.

### Key Highlights
* **Golf Performance Tracking**: Players log their Stableford scores (range 1–45) from played rounds.
* **Latest Five Score System**: The platform retains strictly the 5 newest score entries ordered by played date.
* **Charity Contribution**: A minimum of 10% of subscription revenue supports selected charities, with optional voluntary increases.
* **Monthly Prize Draw Engine**: Subscriber scores deterministically form draw entry numbers (1–45) participating in monthly prize draws with multi-tier prize pools (5-match, 4-match, and 3-match) and 5-match jackpot rollovers.
* **Winner Verification Workflow**: Winners upload scorecard proof screenshots to private storage, reviewed by administrators via time-limited signed URLs before payouts are processed.

---

## 2. How the Website Works

### Step 1 — Create an Account
Users register using Supabase Auth with email and password credentials.

### Step 2 — Subscribe
Users select a subscription plan (`MONTHLY` or `YEARLY`) processed via Stripe Checkout. Active subscriber status unlocks score logging, charity selection, draw participation, and winnings claims.

### Step 3 — Choose a Charity
Subscribers select a verified charity from the directory and configure their contribution percentage (minimum 10%, with voluntary increase up to 100%).

### Step 4 — Log Stableford Scores
Golfers record Stableford scores for played rounds.
* Valid score range: `1–45`
* Constraint: One score per user per played date
* Retention: Platform dynamically maintains strictly the top 5 newest scores by played date.

### Step 5 — Monthly Draw Entry
Each month, subscriber entries are compiled. The user's latest 5 Stableford scores are deterministically normalized into 5 unique lottery numbers (1–45). The draw engine supports `RANDOM` and `SCORE_WEIGHTED` selection strategies.

### Step 6 — Draw Results & Prize Allocation
Published draws display the 5 winning numbers and prize tier distributions:
* **5-Match Tier (Jackpot)**: 40% of tier pool (rolls over if unclaimed)
* **4-Match Tier**: 35% of tier pool
* **3-Match Tier**: 25% of tier pool

### Step 7 — Winner Verification & Payout Workflow
When a subscriber wins:
1. Winner views prize on the Winnings dashboard.
2. Winner uploads a scorecard proof screenshot ($\le 5\text{MB}$, PNG/JPEG/WebP).
3. Proof status becomes `PENDING`.
4. Administrator inspects proof via a time-limited signed URL and marks it `APPROVED` or `REJECTED` (with feedback).
5. Approved winners transition to `PENDING` payout status.
6. Admin processes payout and marks status `PAID` with a transaction reference.

---

## 3. User Features

* **Authentication**: Email/password registration, login, session persistence, and logout via Supabase Auth.
* **Subscription Management**: Plan selection (`MONTHLY`/`YEARLY`), Stripe test checkout redirect, renewal visibility, and period-end cancellation.
* **Charity Selection**: Browse charity directory, view charity details, select active charity, and configure voluntary contribution percentage ($\ge 10\%$).
* **Score Management**: Log Stableford scores (1–45), enforce unique date rule, auto-prune to latest 5 scores, edit/delete existing score entries.
* **Draw Entry & Archive**: View generated draw numbers, inspect upcoming draw countdowns, and browse historical published draw archives.
* **Winnings & Proof Submission**: Dedicated winnings dashboard, score verification proof upload modal, real-time status tracking (`PENDING`, `APPROVED`, `REJECTED`), and payout tracking (`PENDING`, `PAID`).

---

## 4. Admin Features

* **Admin Dashboard**: Real-time metrics overview (active subscribers, active charities, published draws, pending proof count).
* **Charity Management**: Create charities, edit charity metadata, toggle active/featured status, and soft-delete referenced charities (`isActive = false`).
* **Draw Lifecycle Engine**: Create draft draws, simulate draw results with preview statistics, and publish official draws inside an atomic transaction.
* **Winner Verification Workspace**: Inspect uploaded scorecard proofs via private presigned URLs, approve proofs, reject proofs with mandatory feedback reasons, and mark payouts as paid with transaction references.
* **Role-Based Access Control (RBAC)**: All admin routes (`/api/v1/admin/*`) are protected server-side via `requireAdmin` middleware.

---

## 5. Draw & Prize Logic

* **Draw Numbers**: 5 unique numbers in the range `1–45`.
* **Deterministic Cyclic Normalization**: If a user submits duplicate Stableford scores (e.g. `[29, 29, 35, 38, 41]`), numbers are normalized deterministically via cyclic forward offset (`candidate + 1`, wrapping 45 $\rightarrow$ 1) into unique values `[29, 30, 35, 38, 41]`.
* **Prize Tier Allocation**:
  * 5-Match Tier: 40% of prize pool
  * 4-Match Tier: 35% of prize pool
  * 3-Match Tier: 25% of prize pool
* **Jackpot Rollover**: Unclaimed 5-match prize pools automatically roll over to the next draw's 5-match jackpot pool.
* **Integer Money Arithmetic**: All monetary values, pool totals, tier splits, and payouts are calculated and persisted in integer minor units (paise) to prevent floating-point rounding errors.
* **Configurable Prize Pool Revenue**: The prize pool percentage is configurable server-side (`PRIZE_POOL_PERCENTAGE`, default 50%).

---

## 6. Charity Model

* **Minimum Contribution**: 10% of subscription revenue.
* **Voluntary Increase**: Users can voluntarily increase allocation up to 100%.
* **Soft Deletion Integrity**: Deleting a charity referenced by existing user selections soft-deletes the record (`isActive = false`) to preserve database relational constraints.

---

## 7. Winner Verification & Storage Architecture

1. **Upload**: Winner uploads image file via REST endpoint `POST /api/v1/me/winnings/:id/proof`.
2. **Backend Processing**: Server converts base64 input to Buffer, validates format (PNG/JPEG/WebP) and size ($\le 5\text{MB}$), and uploads to private Supabase Storage bucket (`winner-proofs`).
3. **Database Record**: Postgres DB stores `storagePath`, MIME type, and `PENDING` status. Raw base64 bytes are never stored in Postgres.
4. **Presigned Access**: Admin accesses private proof screenshots via server-generated time-limited signed URLs (15-minute expiration).
5. **Resubmission**: Rejection sets status to `REJECTED` with mandatory feedback. Resubmitting resets status to `PENDING` and clears previous feedback.

---

## 8. Technology Stack

### Frontend
* **Core**: React 18, TypeScript, Vite
* **Styling**: Tailwind CSS, shadcn/ui components, Lucide Icons
* **State & Data Fetching**: TanStack Query (React Query)
* **Form & Validation**: React Hook Form, Zod

### Backend
* **Runtime**: Node.js, Express, TypeScript
* **ORM & Database**: Prisma ORM, PostgreSQL (hosted on Supabase)
* **API Architecture**: REST API with Zod validation middleware

### Authentication & Storage
* **Auth**: Supabase Auth (JWT bearer token authorization)
* **Storage**: Supabase Storage (private bucket with presigned URLs)

### Payments & External Services
* **Payments**: Stripe (Checkout Sessions & Webhook Event Sync)

### Testing
* **Runner**: Vitest
* **API Testing**: Supertest

---

## 9. Project Structure

```text
fairway-forward/
├── client/                      # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── app/                 # Router & Layout Shells
│   │   ├── components/          # Shared UI Components
│   │   ├── features/            # Feature Modules (Public, Subscriber, Admin, Payouts)
│   │   ├── hooks/               # Custom React Hooks
│   │   ├── lib/                 # Supabase Client & API Utilities
│   │   ├── types/               # TypeScript Definitions
│   │   ├── App.tsx              # Root Component & Routes
│   │   ├── main.tsx             # Entry Point
│   │   └── index.css            # Tailwind & Theme Styles
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                      # Backend REST API (Node.js + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma        # Database Schema
│   │   ├── seed.ts              # Local Development Data Seeder
│   │   └── migrations/          # SQL Database Migrations
│   ├── src/
│   │   ├── config/              # Environment & Service Configs
│   │   ├── controllers/         # Express Request Controllers
│   │   ├── middleware/          # Auth, Admin, Error & Webhook Middleware
│   │   ├── routes/              # Express API Routes
│   │   ├── services/            # Core Domain Business Logic Services
│   │   ├── types/               # TypeScript Server Types
│   │   ├── utils/               # AppError, Response & Normalizer Helpers
│   │   ├── validators/          # Zod Input Schemas
│   │   ├── app.ts               # Express App Setup
│   │   └── server.ts            # Server Entry Point
│   ├── tests/                   # Automated Vitest Test Suite (92 tests)
│   ├── package.json
│   └── tsconfig.json
├── .env.example                 # Root Environment Variables Template
├── .gitignore                   # Workspace Git Ignore Rules
├── package.json                 # Root Scripts Workspace Config
└── README.md                    # Single Source of Truth Documentation
```

---

## 10. Running Locally

### Prerequisites
* **Node.js**: v18.x or higher
* **npm**: v9.x or higher
* **PostgreSQL / Supabase**: Running PostgreSQL instance or Supabase project
* **Stripe Account**: Stripe test mode API keys (optional for local payment testing)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd fairway-forward

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Environment Variables

Create `.env` in `server/` based on `.env.example`:

```env
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/digital_heroes_db?schema=public"

# Supabase Auth & Storage
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-server-only-service-role-key"

# Stripe Test Mode
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_MONTHLY_PRICE_ID="price_..."
STRIPE_YEARLY_PRICE_ID="price_..."

# Client Origin & App Config
CLIENT_URL="http://localhost:5173"
PRIZE_POOL_PERCENTAGE=50
```

Create `.env` in `client/`:

```env
VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_API_URL="http://localhost:5000"
```

> [!CAUTION]
> Never commit `.env` files or expose server-only keys (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`) in client environment variables.

### 3. Database Setup

```bash
cd server

# Run database migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Seed initial development data
npx prisma db seed
```

### 4. Run Development Servers

Start the server (Terminal 1):
```bash
cd server
npm run dev
# Server running at http://localhost:5000
```

Start the client (Terminal 2):
```bash
cd client
npm run dev
# Client running at http://localhost:5173
```

---

## 11. Testing

### Server Test Suite
Run the backend Vitest test suite:

```bash
cd server
npm test
```
**Baseline Result**: `92/92 server tests passing` across 8 test suites (`health`, `webhook`, `draw`, `me`, `subscription`, `charity`, `payout`, `score`).

### Client Type Check & Production Build
Run TypeScript typecheck and production build:

```bash
cd client
npx tsc --noEmit
npm run build
```
**Baseline Result**: 0 TypeScript errors, clean production bundle build (`dist/`).

---

## 12. API Overview

All backend endpoints are prefixed with `/api/v1`.

### Health Check
* `GET /api/v1/health` — System status check

### Public Endpoints
* `GET /api/v1/charities` — List active charities
* `GET /api/v1/charities/:id` — Get single charity details
* `GET /api/v1/draws` — List published draws archive
* `GET /api/v1/draws/:id` — Get single published draw details

### Authenticated Subscriber Endpoints (`Authorization: Bearer <token>`)
* `GET /api/v1/me` — Get current user profile & subscription state
* `PUT /api/v1/me/profile` — Update user profile details
* `GET /api/v1/me/charity` — Get selected charity & contribution percentage
* `PUT /api/v1/me/charity` — Select charity & update contribution percentage
* `GET /api/v1/scores` — Get user's latest 5 Stableford scores
* `POST /api/v1/scores` — Log a new Stableford score (1–45)
* `PUT /api/v1/scores/:id` — Edit an existing score entry
* `DELETE /api/v1/scores/:id` — Delete a score entry
* `GET /api/v1/subscription` — Get active subscription status
* `POST /api/v1/subscription/checkout` — Create Stripe Checkout session
* `POST /api/v1/subscription/cancel` — Cancel subscription at period end
* `GET /api/v1/me/winnings` — List user's prize winnings
* `GET /api/v1/me/winnings/:id` — Get single winning detail
* `POST /api/v1/me/winnings/:id/proof` — Upload winner scorecard proof screenshot

### Webhook Endpoints
* `POST /api/v1/webhooks/stripe` — Stripe webhook receiver (Raw body signature verified)

### Admin Endpoints (`requireAdmin` middleware)
* `POST /api/v1/admin/charities` — Create new charity
* `PUT /api/v1/admin/charities/:id` — Update charity metadata
* `DELETE /api/v1/admin/charities/:id` — Delete/Deactivate charity
* `GET /api/v1/admin/draws` — List all draws (including draft & simulated)
* `POST /api/v1/admin/draws` — Create draft draw
* `POST /api/v1/admin/draws/:id/simulate` — Simulate draw entry distributions & prize pools
* `POST /api/v1/admin/draws/:id/publish` — Publish official draw (Atomic transaction)
* `GET /api/v1/admin/winners` — List all draw winners & verification statuses
* `POST /api/v1/admin/winners/:id/approve` — Approve winner proof screenshot
* `POST /api/v1/admin/winners/:id/reject` — Reject winner proof screenshot with reason
* `POST /api/v1/admin/winners/:id/mark-paid` — Mark payout as paid with transaction reference

---

## 13. Security Architecture

* **Supabase JWT Verification**: `requireAuth` middleware verifies Supabase Auth access tokens on incoming requests.
* **Role-Based Access Control**: `requireAdmin` checks `user.role === 'ADMIN'` before executing admin operations.
* **Subscription Authorization**: `requireSubscription` enforces active subscription status for subscriber-only features.
* **Data Ownership Scoping**: All user database operations are scoped to `req.user.id` to enforce strict data isolation between accounts.
* **Private Storage & Presigned URLs**: Winner proof images are kept private in Supabase Storage. Access is granted exclusively via server-generated signed URLs with 15-minute expiration.
* **Stripe Signature & Idempotency**: Stripe webhooks use raw body signature verification (`stripe.webhooks.constructEvent`) and log event IDs to `WebhookEvent` table for idempotency.

---

## 14. Evaluator Walkthrough (Testing the App)

### Public Visitor Flow
1. Navigate to Homepage (`/`) and view platform introduction.
2. Click **How It Works** (`/how-it-works`) to review score tracking and draw rules.
3. Click **Charities** (`/charities`) to explore partner charities.
4. Click **Signup** (`/signup`) to register a fresh subscriber account.

### Subscriber Flow
1. Register and sign in at `/login`.
2. Go to **Subscription** (`/subscription`) to initialize a test plan.
3. Go to **Charity** (`/charity`) to select a charity and set contribution percentage ($\ge 10\%$).
4. Go to **Scores** (`/scores`) and add Stableford scores (range 1–45). Note that only the latest 5 scores are retained.
5. Go to **Draws** (`/draws`) to inspect upcoming draw entry numbers and historical draw results.
6. Go to **Winnings** (`/winnings`) to view prize matches and test proof upload.

### Admin Flow
*(Admin credentials provided separately for evaluation)*
1. Log in with an administrator account.
2. Access **Admin Dashboard** (`/admin`).
3. Manage charities under **Admin Charity Management** (`/admin/charities`).
4. Execute draw lifecycle (Draft $\rightarrow$ Simulate $\rightarrow$ Publish) under **Admin Draw Management** (`/admin/draws`).
5. Review pending scorecard proof screenshots and process payouts under **Admin Winners** (`/admin/winners`).

---

## 15. Deployment Guidelines

### Database & Storage (Supabase)
1. Run Prisma migrations on production database: `npx prisma migrate deploy`.
2. Create a private storage bucket named `winner-proofs` in Supabase Storage with `Public` disabled.

### Backend (Render / Railway / Fly.io)
1. Set environment variables (`DATABASE_URL`, `SUPABASE_*`, `STRIPE_*`, `CLIENT_URL`).
2. Build command: `npm run build`.
3. Start command: `npm start` (`node dist/server.js`).

### Frontend (Vercel / Netlify)
1. Set environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`).
2. Build command: `npm run build`.
3. Output directory: `dist`.

---

## 16. Project Status

Fairway Forward is a full-stack golf performance and social impact web platform built for the Digital Heroes trainee assignment.

* **Frontend**: Complete, responsive, styled with Tailwind CSS & shadcn/ui.
* **Backend**: Complete REST API with Express, TypeScript, and Prisma ORM.
* **Database**: Fully modeled PostgreSQL schema with migrations & seeding.
* **Authentication**: Supabase Auth integration.
* **Subscription System**: Stripe Checkout & Webhook handling.
* **Draw Engine**: Multi-tier draw engine with jackpot rollover & cyclic score normalization.
* **Verification & Payouts**: Private storage proof verification & payout tracking.
* **Automated Tests**: 92 server unit/integration tests passing.
