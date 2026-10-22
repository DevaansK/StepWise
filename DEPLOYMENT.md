# StepWise — Production Deployment & Backend Configuration Guide

StepWise is an enterprise-grade **College Administrative Service and Process Automation System** built with **React 19, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth + Storage)**, and deployed on **Vercel** with GitHub CI/CD.

This document provides complete instructions for provisioning the Supabase backend, running database migrations, setting up Row Level Security (RLS), and configuring Vercel for zero-downtime deployment.

---

## 1. Architecture Overview

```
                      +---------------------------------------+
                      |       Vercel Edge / CDN / Client       |
                      |   React 19 SPA + Vite + Tailwind CSS   |
                      +-------------------+-------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v                                   v
             +--------------------+               +--------------------+
             |   Supabase Auth    |               |  Vercel Serverless |
             |  JWT Sessions      |               |  Express / Gemini  |
             +---------+----------+               +--------------------+
                       |
                       v
             +--------------------+
             | Supabase PostgreSQL| <---+ Row Level Security (RLS)
             | - public.profiles  | <---+ Student isolation
             | - service_requests | <---+ Staff department queues
             | - request_histories| <---+ Approver endorsements
             | - departments      | <---+ Admin full access
             | - services         |
             | - notifications    |
             +---------+----------+
                       |
                       v
             +--------------------+
             |  Supabase Storage  |
             | stepwise-documents |
             +--------------------+
```

---

## 2. Supabase Backend Setup (5 Minutes)

### Step 2.1: Create a Supabase Project
1. Log in to [Supabase Console](https://supabase.com/dashboard).
2. Click **New Project**.
3. Choose an organization, enter Project Name: `StepWise-College-Admin`, set a secure database password, and pick a cloud region nearest to your institution.
4. Wait ~2 minutes for provisioning to complete.

### Step 2.2: Run Database Migration Script
1. In your Supabase Dashboard, navigate to the **SQL Editor** tab (left sidebar).
2. Click **+ New Query**.
3. Open `supabase/schema.sql` from this repository.
4. Copy the entire file content and paste it into the Supabase SQL Editor.
5. Click **Run** (or `Cmd + Enter`).
6. You will see:
   - `CREATE TABLE departments`
   - `CREATE TABLE profiles`
   - `CREATE TABLE services`
   - `CREATE TABLE service_requests`
   - `CREATE TABLE request_histories`
   - `CREATE TABLE notifications`
   - `CREATE TRIGGER on_auth_user_created`
   - Storage bucket `stepwise-documents` created
   - Row Level Security (RLS) policies successfully enabled and bound.
   - Initial seed data inserted for college departments and services.

### Step 2.3: Configure Supabase Auth Settings
1. Go to **Authentication** > **URL Configuration** in the Supabase Dashboard:
   - **Site URL**: `https://<your-vercel-app>.vercel.app` (or `http://localhost:3000` during local testing).
   - **Redirect URLs**: Add:
     - `https://<your-vercel-app>.vercel.app/**`
     - `http://localhost:3000/**`
2. Go to **Authentication** > **Providers** > **Email**:
   - For rapid campus testing and evaluator reviews, you can optionally toggle **Confirm email** off so newly registered accounts can log in immediately without waiting for an email verification loop.

### Step 2.4: Retrieve API Keys
Navigate to **Project Settings** > **API**:
- Copy the **Project URL** (e.g. `https://xyzproject.supabase.co`).
- Copy the **Project API Keys** `anon` `public` key.
- Copy the `service_role` `secret` key (for backend environment variables only).

---

## 3. Vercel Deployment Guide

### Step 3.1: Import GitHub Repository
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** > **Project**.
3. Select your connected GitHub repository containing StepWise.

### Step 3.2: Configure Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3.3: Configure Environment Variables
In the Vercel **Environment Variables** panel, add the following exact keys:

| Variable Name | Environment | Value Description |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Production, Preview, Dev | Your Supabase Project URL (`https://<project-id>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Production, Preview, Dev | Your Supabase `anon` `public` API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | Your Supabase `service_role` secret (server-side only) |
| `GEMINI_API_KEY` | Production, Preview, Dev | Google Gemini API key for the AI Administrative Advisor |

### Step 3.4: Deploy
Click **Deploy**. Vercel will compile the TypeScript application, optimize Tailwind v4 assets, and deploy to an edge URL (e.g. `https://stepwise-automation.vercel.app`).

---

## 4. Local Development Configuration

To run locally with Supabase connected:

1. Clone your repository:
   ```bash
   git clone https://github.com/your-org/stepwise.git
   cd stepwise
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Fill in your keys in `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-supabase-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   GEMINI_API_KEY=your-gemini-api-key
   ```

4. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

*Note on Local Fallback:* If `VITE_SUPABASE_URL` is omitted or unconfigured, StepWise automatically runs in high-fidelity prototype state mode with full seed data and password hashing, ensuring zero crashes for offline evaluation or quick demonstrations.

---

## 5. End-to-End Verification Checklist

Verify all 4 institutional roles and backend flows:

### 1. Student Workflow
- [x] Register a new student account (`alex.test@campus.edu`).
- [x] Verify that self-registration strictly assigns the `STUDENT` role (privilege escalation blocked).
- [x] Navigate to **Browse Services** and select **Bonafide Certificate**.
- [x] Complete form fields and attach PDF/image documents (uploaded to `stepwise-documents` bucket).
- [x] Submit request and observe generated ID (`SW-2026-XXXX`).
- [x] Check **My Requests** to verify the request is recorded in `Submitted` status.

### 2. Department Staff Workflow
- [x] Log in as **Dr. Meera Patel** (Academic Affairs Staff) using the quick-switcher or credentials.
- [x] Open **Assigned Queue** to view the student's submitted request.
- [x] Test **Request Additional Information**: enter a query; verify status updates to `Additional Information Required`.
- [x] Switch back to Student: notice in-app notification, upload supplemental response file, and click Resubmit.
- [x] Switch back to Staff: verify documents and click **Verify & Forward to Approving Authority**.
- [x] Status updates to `Pending Approval`.

### 3. Approving Authority Workflow
- [x] Log in as **Prof. Robert Vance** (Dean of Academic Affairs).
- [x] Open **Pending Approvals** queue.
- [x] Inspect request details, verified document checklist, and staff notes.
- [x] Click **Approve & Sign Certificate** with official remarks.
- [x] Switch to Student: click **View / Print Official Certificate** to verify the digital institutional seal, QR code, and Dean's endorsement.

### 4. Admin Workflow
- [x] Log in as **Sarah Jenkins** (Administrator).
- [x] View institutional analytics across all departments and average processing times.
- [x] View **All College Requests** with cross-department filters.
- [x] Test **Manage Services**: toggle service active/inactive status or create a new service.

---

## 6. Database Security & Maintenance Summary

- **Row Level Security (RLS):** Every table has RLS enabled with security definer functions (`current_user_role()`, `current_user_department()`).
- **Student Privacy:** Students can only read/query their own records (`student_id = auth.uid()`).
- **Staff Privacy:** Department staff can only access requests assigned to their department.
- **Audit Trails:** Every status transition, remark, and actor is appended to `public.request_histories` as an immutable audit record.
