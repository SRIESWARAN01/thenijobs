# THENIJOBS — Status, Fixes & Forward Roadmap

**Date:** 2026-06-06
**Stack:** Next.js 15 · React 19 · TypeScript (strict) · Firebase (Auth + Firestore + Storage) · Firebase Functions
**Verification method:** Static review of live source (the Linux build sandbox was unavailable in this session — "not enough disk space" — so `npm run build` / `tsc` were *not* re-run here; see "The build error" below).

---

## 1. Headline

The issues catalogued in `ANALYSIS_REPORT.md` are **already implemented in the current code**. That report was written against an earlier state; the codebase has since moved well past it. This session verified each item against the live source and closed the last two stragglers.

There is **no outstanding bug from the report**. To fix a *specific* build/compile error you're hitting, I need the actual error text (the sandbox here can't run the build — see §4).

---

## 2. Verification matrix (report item → live status)

| ID | Issue | Status | Where it's handled now |
|----|-------|--------|------------------------|
| C1 | Admin/seeker routes unprotected | ✅ Fixed | `admin/layout.tsx` → `useRequireAuth(['admin','super_admin'],'/admin/login')`; `seeker/layout.tsx` → `useRequireAuth(['job_seeker'])` |
| C2 | Missing Firestore composite indexes | ✅ Fixed | `firestore.indexes.json` present (applications, notifications, conversations, jobs, savedJobs) and registered in `firebase.json` |
| C3 | Leaderboard blocked by rules | ✅ Fixed | `firestore.rules` → `match /gamification/{userId}` now `allow read: if isAuthenticated()` |
| H1 | Apply flow skipped notify/count; `resumeURL` casing | ✅ Fixed | `JobDetailPageClient.handleApply()` routes through `applyToJob()` and writes `resumeUrl` |
| H2 | New-application notification sent to wrong id | ✅ Fixed | `applyToJob()` resolves `companies/{id}.ownerId` before `createNotification()` |
| H3 | Deadline collected but not saved | ✅ Fixed | `post-job` writes `deadline`; `JobDetailPageClient` reads `d.deadline` |
| H4 | Company links used job id | ✅ Fixed | `jobs/page.tsx` links `/company/${job.companySlug || job.companyId}` |
| H5 | Sort control did nothing | ✅ Fixed | `jobs/page.tsx` applies `switch (sortBy)` to the list |
| H6 | Registration dropped phone | ✅ Fixed | `register` passes `+91${phone}` into `createAccount()` |
| H7 | Supplier/service_provider had no portal | ✅ Fixed | Roles removed from `register` `ROLES` (comment: "portals not yet built") |
| M1 | `useCollection` ignored constraint changes | ✅ Fixed | `useFirestore.ts` adds `constraintKey` (serialized) to effect deps |
| M2 | Field-name write/read mismatches | ✅ Fixed | `resumeUrl`, `deadline`, `companySlug` aligned across writes/reads |
| M3 | Over-broad client fetching for counts | ✅ Fixed | `getCountFromServer()` used in `firestoreService.ts` + `useRealtimeStats.ts` |
| M4 | Firebase keys hardcoded as fallback | ✅ Fixed | `config.ts` requires `NEXT_PUBLIC_FIREBASE_*`, throws if missing |
| M5 | `alert()` for all feedback | ✅ Fixed | 0 `alert(` calls remain in `src`; toast system (`ToastContext`/`showToast`) in use |
| M6 | Vestigial Realtime Database | ✅ Fixed | `database.rules.json` removed; no `getDatabase` import in `config.ts` |
| L1 | Dead nav constants / wrong hrefs | ✅ Fixed | No references to `ADMIN_NAV_ITEMS`/`Sidebar` remain; layouts use inline nav |
| L2 | "Duplicate" company profile component | ✅ Not a bug | `CompanyProfilePageClient.tsx` imports & renders `CompanyProfileClient.tsx` — both are used; **do not delete** |
| L3 | Missing PWA/OG assets | ✅ Fixed this session | References repointed to existing `public/logo.png` and `public/thenijobs-platform-preview.png` |
| L4 | Auth/UX small bugs | ✅ Fixed | Admin `signOut()` on logout; role memoization in `useRequireAuth`; seeker "Open to Work" reads `preferences`; **profile strength now computed** (this session) |

---

## 3. Changes made this session

1. **`src/app/layout.tsx`** — `og-image.jpg` → `/thenijobs-platform-preview.png` (OpenGraph + Twitter); `apple-touch-icon` → `/logo.png`. Removes broken share-preview and iOS icon.
2. **`public/manifest.json`** — icon entries `icon-192.png` / `icon-512.png` (nonexistent) → `/logo.png`. PWA install no longer 404s on icons.
3. **`src/app/seeker/layout.tsx`** — "Profile Strength **65%**" hardcode replaced with a computed `profileStrength` (uses `user.profileScore.total` when present, otherwise a 6-field completion heuristic).

All three are low-risk, self-contained edits. None change data models or routing.

---

## 4. The build/compile error (action needed from you)

I could not reproduce a build error here because the Linux sandbox failed to start ("not enough disk space"). A `.next/` build output already exists in the repo, which means the project **built successfully at some point** — so if you're seeing an error now it's likely a recent regression or environment issue, not one of the report bugs.

To get it fixed, run this on your machine and paste the output:

```bash
cd thenijobs-main
npx tsc --noEmit      # surfaces type errors only (fast)
npm run build         # full Next.js production build
```

If the error is "not enough disk space" / the build won't start at all, that's an **environment** problem — clear space (the `node_modules`, `.next`, and `.firebase` caches in this repo are large) and retry:

```bash
# from thenijobs-main/
rm -rf .next .firebase/thenijobs-9f01d/functions/.next   # safe: regenerated on build
```

---

## 5. Remaining polish (optional, low priority)

- **Dedicated icons/OG image.** Today's fix reuses `logo.png` for the 192/512 PWA icons and `thenijobs-platform-preview.png` for OG. For best results, add purpose-built square maskable PNGs (`icon-192.png`, `icon-512.png`) and a 1200×630 `og-image.jpg`, then point the references back. (Needs an image tool / design pass.)
- **Re-enable strict lint.** `eslint.config.mjs` disables `@typescript-eslint/no-explicit-any` and several `react-hooks` rules. The many `useCollection<any>` casts hide type drift. Re-enabling and typing collections improves stability under React 19's compiler.
- **Profile strength source of truth.** The new heuristic is a fallback; ideally a Cloud Function writes `user.profileScore.total` so the bar matches the seeker dashboard's own scoring.

---

## 6. Future enhancement roadmap (prioritized)

### Tier 1 — revenue & advertised-but-missing features
- **Payments.** Billing CTAs exist but no gateway is wired. Integrate Razorpay (India-first; UPI/cards) or Stripe: checkout → webhook (Cloud Function) → write `payments` + `subscriptions` docs (rules already exist for both). Gate premium/featured listings on subscription status.
- **Supplier & Service-Provider portals.** Two roles were removed from signup because they had no home. Build `/supplier/*` and `/service-provider/*` portals (services CRUD, leads inbox, profile), then re-add the roles to `register` and the `useRequireAuth` redirect switch.

### Tier 2 — core marketplace quality
- **Server-side candidate matching.** Replace the employer "Candidates" page's full `seekerProfiles` download with a Cloud Function that ranks and returns only minimal candidate cards (privacy + cost). Pairs with the existing `getCountFromServer` direction.
- **Real-time chat hardening.** `conversations`/`messages` rules and indexes exist; add typing indicators, unread counts per conversation, and push/email notifications on new messages.
- **Job alerts delivery.** `jobAlerts` are stored but need a scheduled Cloud Function (cron) to match new jobs against alerts and send notifications/email.

### Tier 3 — growth & differentiation
- **AI features.** `ai-coach` and `aiSummary` scaffolding exists — wire to an LLM for resume feedback, JD generation, and candidate summaries (server-side key, never client).
- **Tamil (i18n).** Nav already carries `tamilLabel`s; promote to full bilingual UI via `next-intl` or similar — strong local-market fit for Theni/Tamil Nadu.
- **Analytics dashboards.** Employer/admin reports backed by aggregated counters (Cloud Functions incrementing summary docs) rather than client-side aggregation.

### Tier 4 — engineering hygiene
- **CI + tests.** Add `npm run verify` (lint + typecheck + build) to GitHub Actions; add Playwright smoke tests for the apply → notify → interview loop and the auth guards.
- **Accessibility & performance.** Audit color contrast on the dark theme, add focus states, lazy-load heavy charts (`recharts`), and verify Core Web Vitals.

---

*Bottom line: the documented errors are closed and two final polish items were fixed today. The next concrete step that needs you is pasting the real `tsc`/`build` output if a specific error remains — everything else above is forward feature work, prioritized.*
