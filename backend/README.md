# StepWise backend foundation

This repository uses Vercel serverless functions for deployed API routes and Supabase for persistent request storage.

## API routes

- `GET /api/health` — checks whether the required Supabase environment variables exist.
- `GET /api/requests` — lists the authenticated user's saved requests.
- `POST /api/requests` — saves a request payload for the authenticated user.

Protected routes require `Authorization: Bearer <Supabase access token>`. The API validates the token with Supabase Auth and uses the caller's verified user ID; it does not accept an owner ID from the request body.

## Configure Supabase

1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. In Vercel project settings, add:
   - `SUPABASE_URL` — the project URL.
   - `SUPABASE_ANON_KEY` — the project's publishable/anon key.
4. Add the same variables to your local `.env.local` for local development.
5. Redeploy the Vercel project and test `/api/health`.

Do not put a Supabase service-role key in frontend code or expose it to browsers.

## Important integration status

The current React application still uses browser `localStorage` and demo-role switching in `src/context/AppContext.tsx`. These API routes are a backend foundation; they do **not** automatically replace the current demo authentication or localStorage persistence. Before production use, connect the frontend to Supabase Auth, pass real access tokens to these endpoints, and migrate request creation/tracking to the API. Staff/approver authorization and document storage also require dedicated server-side policies and storage configuration.
