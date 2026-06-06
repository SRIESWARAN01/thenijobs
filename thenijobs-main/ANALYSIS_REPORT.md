# THENIJOBS — Full App Analysis: Errors & Workflow Mistakes

**Stack:** Next.js 16 · React 19 · TypeScript (strict) · Firebase (Auth + Firestore + Storage)
**Scope:** Whole app — admin, employer, seeker & public portals, shared lib, auth, Firebase config, build setup.
**Date:** 2026-06-06

> Note: A live `next build` / `tsc` could not be run in this session (sandbox unavailable). Build/type findings below are from static review — run `npm run build` and `npx tsc --noEmit` to confirm.

Findings are grouped by severity. Each item lists the file(s), what is wrong, the impact, and the fix.

---

## 🔴 Critical — security & "nothing loads" bugs

### C1. Admin and Seeker portals have no route protection
- **Where:** `src/app/admin/layout.tsx`, `src/app/seeker/layout.tsx`
- **Problem:** Only the **employer** layout calls `useRequireAuth([...])`. The admin layout has no auth check at all, and the seeker layout uses `useAuth()` (read-only) instead of `useRequireAuth()`. Any visitor can open `/admin/dashboard`, `/seeker/...` directly.
- **Impact:** Admin/seeker UI shells render for unauthenticated or wrong-role users. Data stays protected by Firestore rules, so those users see the admin shell full of permission-denied/empty states — confusing and a security smell.
- **Fix:** Guard both layouts. Admin: `useRequireAuth(['admin','super_admin'])`. Seeker: `useRequireAuth(['job_seeker'])` (or all logged-in users). Redirect to `/login` (or `/admin/login`) when not allowed.

### C2. Missing Firestore composite indexes
- **Where:** `firebase.json` (no `firestore.indexes` entry); queries in `firestoreService.ts`, `NotificationContext.tsx`, `employer/dashboard`, `employer/candidates`.
- **Problem:** Several queries combine an equality filter with `orderBy` (or an extra filter), which Firestore **requires a composite index** for. No index file is deployed. Affected queries include:
  - `applications`: `where('companyId','==',…) + orderBy('createdAt','desc')`
  - `notifications`: `where('userId','==',…) + orderBy('createdAt','desc')`
  - `markAllNotificationsRead`: `where('userId','==',…) + where('read','==',false)`
  - `conversations`: `where('participants','array-contains',…) + where('status','==','active')`
- **Impact:** These throw `FAILED_PRECONDITION: The query requires an index` at runtime → employer application lists, the notification bell, and chat silently fail (empty + console error).
- **Fix:** Add a `firestore.indexes.json`, register it in `firebase.json`, and `firebase deploy --only firestore:indexes`. (The error message in the console gives a one-click "create index" link for each.)

### C3. Leaderboard read is blocked by security rules
- **Where:** `firestoreService.getLeaderboard()` vs `firestore.rules` `match /gamification/{userId}`
- **Problem:** `getLeaderboard()` reads the whole `gamification` collection, but the rule only allows reading a gamification doc if you are its owner or an admin. A normal seeker requesting the leaderboard is denied.
- **Impact:** Leaderboard / rewards widgets error out for every non-admin user (the exact users meant to see them).
- **Fix:** Either expose a public, minimal `leaderboard` collection (uid, name, monthlyPoints) written by a Cloud Function, or relax the rule to allow reading a whitelisted set of leaderboard fields.

---

## 🟠 High — broken end-user workflows

### H1. Applying to a job never notifies the employer
- **Where:** `src/app/jobs/[id]/JobDetailPageClient.tsx` → `handleApply()`
- **Problem:** The apply handler writes the application with a raw `addDoc` and explicitly skips the follow-ups (there's even a "skip for simplicity" comment). It does **not** create an employer notification, increment the job's application count, or log activity. It also writes the field as **`resumeURL`** while the rest of the app reads **`resumeUrl`**.
- **Impact:** Employers are never alerted to new applicants; application counts stay at 0; the employer's candidate view can't find the resume (casing mismatch).
- **Fix:** Route applications through `firestoreService.applyToJob()` (or replicate its notification + count + log steps) and standardize on `resumeUrl`.

### H2. `applyToJob()` sends the new-application notification to the wrong id
- **Where:** `src/lib/firebase/firestoreService.ts` → `applyToJob()`
- **Problem:** `createNotification({ userId: data.companyId, … })` — the code comment says "will need to resolve to company owner." `companyId` is the company **document id**, not a user id, so notifications are queried by `userId` and never delivered.
- **Impact:** Even the "correct" apply path doesn't reach the employer.
- **Fix:** Look up the company's `ownerId` and send the notification to that uid.

### H3. Application deadline is collected but never saved
- **Where:** `src/app/employer/post-job/page.tsx` (`form.deadline` not included in `jobData`) and `src/app/jobs/[id]/JobDetailPageClient.tsx` (reads `d.expiresAt`).
- **Problem:** The Post-Job form captures a deadline, but it's omitted from the document written to Firestore. The Job Detail page then reads a *different* field (`expiresAt`).
- **Impact:** Deadline is lost on save and always renders as "N/A" for candidates.
- **Fix:** Include `deadline` in `jobData` and read the same field name on the detail page.

### H4. "Company" links from job cards go to the job id, not the company
- **Where:** `src/app/jobs/page.tsx` — `href={`/company/${job.id}`}` (both the company name and the Company button).
- **Problem:** The route is `/company/[slug]` and resolves by company **slug**, but it's handed the **job** id.
- **Impact:** Company links from the jobs list lead to an empty/not-found company page.
- **Fix:** Store and link the company slug (or id) on each job card: `/company/${job.companySlug}`.

### H5. Job-list "Sort" control does nothing
- **Where:** `src/app/jobs/page.tsx` — `sortBy` state + dropdown.
- **Problem:** `sortBy` (Latest / Salary / Relevance) is read into state but never applied; `filtered` is only filtered, never sorted.
- **Impact:** Sorting silently has no effect.
- **Fix:** Apply a `.sort()` on `filtered` keyed off `sortBy` (by `createdAt`, by `salaryMax`, etc.).

### H6. Registration drops the phone number
- **Where:** `src/app/register/page.tsx` → `next()` (step 2).
- **Problem:** After `await createAccount(...)`, it checks `if (form.phone && user?.uid)`. `user` comes from auth context state, which only updates asynchronously after `onAuthStateChanged` → so `user?.uid` is still `null` immediately after sign-up. The phone write is skipped.
- **Impact:** Phone numbers entered during signup are never stored.
- **Fix:** Have `createAccount` accept/persist the phone, or return the new uid and write phone with that uid (don't rely on context state in the same tick).

### H7. Supplier / Service Provider roles have no portal
- **Where:** `src/app/register/page.tsx` (`ROLES`), `src/lib/types/index.ts` (`UserRole`), redirect logic in `login`/`register`.
- **Problem:** Registration offers 5 roles, but only `job_seeker`, `employer`, `business_owner` (+ admin) have portals/routes. `supplier` and `service_provider` fall through the redirect `else` into `/seeker/dashboard`.
- **Impact:** Two advertised user types hit a dead end in the wrong portal.
- **Fix:** Either build those portals or remove the roles from registration until they exist.

---

## 🟡 Medium — reliability & data consistency

### M1. `useCollection` ignores changes to query constraints
- **Where:** `src/hooks/useFirestore.ts` → `useCollection`.
- **Problem:** Constraints are stashed in `constraintsRef` and deliberately left out of the effect deps `[collectionName, options.skip, refreshKey]`. If a caller changes a filter/sort by passing new constraints (without changing collection name or `skip`), the listener does **not** re-subscribe.
- **Impact:** Dynamic, constraint-driven filtering/sorting won't update results unless `refresh()` is called. (Most pages dodge this today by filtering in memory, which hides the bug but limits scalability.)
- **Fix:** Serialize constraints into a stable string and include it in the deps, or require callers to memoize constraints and depend on them.

### M2. Field-name inconsistencies between writes and reads
- **Where:** multiple.
  - `applicationCount` (type/`approveJob` mindset) vs `applicationsCount` (written in `post-job`).
  - `resumeUrl` (type, `applyToJob`) vs `resumeURL` (written in Job Detail apply).
  - `appliedAt` (type `JobApplication`) vs `createdAt` (actually written).
- **Impact:** Counts and links silently read `undefined`; any code filtering/sorting on `appliedAt` gets nothing.
- **Fix:** Pick one canonical name per field and align writes, reads, and the TS types.

### M3. Over-broad client-side data fetching
- **Where:** `src/app/employer/candidates/page.tsx` (`useCollection('seekerProfiles', [])`), `src/hooks/useRealtimeStats.ts` (`usePlatformStats` counts via full-collection `onSnapshot`).
- **Problem:** Candidates loads the **entire** `seekerProfiles` collection to the browser to compute matches; admin stats download whole collections just to read `snapshot.size`.
- **Impact:** Privacy exposure (every seeker's full profile shipped to any employer client), plus cost/latency that grows linearly with users.
- **Fix:** Use `getCountFromServer()` for counts; do candidate matching server-side (Cloud Function) returning only ranked, minimal candidate cards.

### M4. Firebase config hardcoded as fallback
- **Where:** `src/lib/firebase/config.ts`
- **Problem:** Real project keys are committed as `|| "…"` fallbacks. (Firebase web API keys aren't secrets, but committing them invites copy-paste into the wrong project and disables the env-var safety net.)
- **Fix:** Require the `NEXT_PUBLIC_FIREBASE_*` env vars; fail fast if missing. Provide a `.env.example`.

### M5. `alert()` used for all user feedback
- **Where:** ~25 pages (e.g. `employer/*`, `seeker/*`, `jobs/*`).
- **Problem:** Native `alert()`/`window` dialogs are used for success/error messaging despite a `Toast` (radix) and a `Modal` component being available. Some are stubs, e.g. `employer/billing` → `alert('Payment gateway integration coming soon!')` (payments are unimplemented).
- **Impact:** Jarring UX, blocks the main thread, looks unfinished.
- **Fix:** Replace with the toast/modal system; implement or hide the payment CTA.

### M6. Realtime Database config is vestigial
- **Where:** `database.rules.json`, `getDatabase()` in `config.ts`.
- **Problem:** RTDB is initialized and a full `database.rules.json` is maintained, but the app stores everything in **Firestore**. The RTDB rules apply to a database the app doesn't use.
- **Fix:** Remove the RTDB init + rules (or document why they exist) to avoid confusion about where data/permissions live.

---

## 🟢 Low — polish, dead code, missing assets

### L1. Dead navigation code with wrong links
- **Where:** `src/lib/constants.ts` (`ADMIN_NAV_ITEMS`, `EMPLOYER_NAV_ITEMS`, `SEEKER_NAV_ITEMS`) and `src/components/ui/Sidebar.tsx`.
- **Problem:** None of these are imported anywhere — each layout has its own inline nav. The unused constants also contain **wrong** hrefs (`/admin/companies` vs real `/admin/businesses`, `/admin/applications`, `/admin/advertisements` vs `/admin/ads`, `/employer/company` vs `/employer/company-profile`, `/seeker/saved` vs `/seeker/saved-jobs`, plus `/admin/franchises|support|analytics|activity` that don't exist).
- **Impact:** Harmless today, but a trap: wiring up `Sidebar` later would ship a sidebar full of 404s.
- **Fix:** Delete the unused `Sidebar` + nav constants, or fix the hrefs and adopt them as the single source of truth.

### L2. Duplicate company-profile client component
- **Where:** `src/app/company/[slug]/CompanyProfileClient.tsx` and `CompanyProfilePageClient.tsx` — only the latter is imported.
- **Fix:** Remove the unused file.

### L3. Missing public assets referenced in code
- **Where:** `src/app/layout.tsx` (`/og-image.jpg`, `/icon-192.png`), `public/manifest.json` (`/icon-192.png`, `/icon-512.png`).
- **Problem:** None of these files exist in `public/`.
- **Impact:** Broken PWA install icons and broken OpenGraph/Twitter share preview.
- **Fix:** Add the icon and OG image files (or update the references).

### L4. Auth/UX small bugs
- `login/page.tsx`: "Resend OTP" button has no `onClick` (dead); OTP boxes don't handle backspace navigation.
- `admin/layout.tsx`: `handleLogout` only `router.push('/login')` — it never calls Firebase `signOut()`, so the admin session stays active (employer/seeker do sign out).
- `seeker/layout.tsx`: "Profile Strength 65%" and "🟢 Open to Work" are hardcoded; `admin/layout.tsx` shows hardcoded "Super Admin / admin@thenijobs.com".
- `hooks/useAuth.ts` → `useRequireAuth`: `allowedRoles` is taken as an array literal and used as an effect dep, so a new array each render re-runs the guard effect every render. Memoize or compare by content.

---

## Build / type-check notes
- `tsconfig.json` has `strict: true` and `next.config.ts` does **not** set `typescript.ignoreBuildErrors`, so any type error will fail `next build`. The pervasive `useCollection<any>` and `any` casts hide type mismatches (like the field-name issues in M2) from the compiler rather than fixing them.
- `eslint.config.mjs` turns **off** `@typescript-eslint/no-explicit-any` and several `react-hooks` rules (`purity`, `refs`, `set-state-in-effect`, `static-components`). That suppresses warnings the React Compiler would otherwise flag — worth re-enabling and fixing for stability under React 19.
- **Action:** run `npm run build` and `npx tsc --noEmit` to surface concrete type errors (couldn't run here).

---

## Suggested fix order
1. **C1, C2, C3** — they make whole sections (admin auth, employer applications, notifications, leaderboard) fail or expose the shell.
2. **H1, H2, H3, H6** — the core seeker→employer hiring loop (apply → notify → deadline → contactable).
3. **H4, H5, H7** — navigation/discovery correctness.
4. **M1–M6** — reliability, privacy, consistency.
5. **L1–L4** — cleanup and polish.
