# Branch Visit Tracker — Setup Guide

## Quick Start

### 1. Install dependencies
```bash
pnpm install
```

### 2. Setup environment variables
Edit `.env`:
- `DATABASE_URL` — your MySQL connection string (already set)
- `JWT_SECRET` — change to a long random string before deploying!

### 3. Run database migrations
```bash
pnpm db:push
```

### 4. Create the first admin user
```bash
pnpm seed
```
Default credentials: `admin` / `admin123`  
**Change the password after first login!**

### 5. Start development server
```bash
pnpm dev
```
Open http://localhost:3000

---

## User Roles

| Role | Access |
|------|--------|
| **admin** | Dashboard, Branches, Managers, Reports |
| **user** | Check-in, Visit History |

## Adding Users (as Admin)
Use the tRPC `users.create` procedure via your admin panel or API.

## Photo Storage
- Without S3: photos saved locally in `/uploads` folder
- With S3: set `AWS_S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` in `.env`

## Auth Flow
1. User visits the app → sees login form
2. Enters username + password → `POST /api/auth/login`
3. Server verifies password, sets httpOnly JWT cookie
4. All subsequent requests authenticated via cookie
5. Logout clears the cookie
