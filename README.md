# 🌸 Narunthingal Portal

Official portal for the **Narunthingal** organizing committee — applications, voting, and administration.

Built with **Next.js 15**, **Supabase**, **TypeScript**, and **Tailwind CSS**.

---

## Features

| Feature | Description |
|---|---|
| 🔐 IIT-only login | Google sign-in restricted to `@iit.ac.lk` accounts |
| 📋 Application form | Apply for President, Secretary, Treasurer, Project Coordinator, Event Coordinator, PR Head, or Editor |
| 👥 Admin — Candidates | Search, filter, sort, and expand all applications; export to CSV |
| 🗳️ Admin — Voting | Create voting events with custom candidates, activate/deactivate, see live results |
| 🗳️ User voting | Vote in active elections; one vote per person per event |

---

## Quick Start

### 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql)
3. Go to **Authentication → Providers → Google** and enable Google OAuth  
   - Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
   - Add `https://your-project-id.supabase.co/auth/v1/callback` as a redirect URI

### 2. Configure admin emails

Edit [`lib/admin.ts`](lib/admin.ts) and add the IIT email addresses of your admins:

```ts
export const ADMIN_EMAILS: string[] = [
  "yourname.20230001@iit.ac.lk",
];
```

### 3. Set environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase project URL and anon key (from **Settings → API** in your Supabase dashboard).

### 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import it at [vercel.com](https://vercel.com)
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. In Supabase → **Authentication → URL Configuration**, add your Vercel URL to **Redirect URLs**:
   - `https://your-app.vercel.app/auth/callback`

---

## Project Structure

```
app/
  login/           Sign-in page (Google OAuth)
  apply/           Application form
  vote/            User voting ballot
  admin/
    candidates/    All applications (admin only)
    voting/        Voting event management (admin only)
  auth/callback/   OAuth callback handler

components/
  Navbar.tsx       Navigation bar

lib/
  admin.ts         Admin email whitelist
  types.ts         Shared TypeScript types
  supabase/        Supabase client helpers

supabase/
  schema.sql       Database schema (run once in Supabase SQL editor)
```

---

## Application Form Fields

- Full name
- WhatsApp contact number
- First preference position
- Why they are suitable (open text)
- Second preference position (optional)
- Volunteered in last year's Narunthingal? (Yes/No)
  - If Yes: what they did
- Current clubs at IIT and positions held
- Previous volunteering / organizing experience

---

*நேர்மையான ஊழியம் — Honest Service*
