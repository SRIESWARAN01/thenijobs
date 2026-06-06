# THENIJOBS — Complete Workflows Reference

A full map of every user and system workflow in the app, traced from the actual code (routes, hooks, and `firestoreService.ts`). Use it as a functional spec / onboarding doc.

**Roles:** `job_seeker` · `employer` · `business_owner` · `supplier`* · `service_provider`* · `admin` · `super_admin`
(*supplier & service_provider can register but have no portal yet — see Gaps.)

**Portals (route groups):**
`/` public site · `/seeker/*` job seeker · `/employer/*` employer · `/admin/*` admin · `/jobs`, `/businesses`, `/company/[slug]` public detail pages.

**Firestore collections used:** `users`, `seekerProfiles`, `companies`, `jobs`, `applications`, `savedJobs`, `jobAlerts`, `interviews`, `leads`, `reviews`, `services`, `subscriptions`, `payments`, `advertisements`, `notifications`, `broadcasts`, `conversations` (+ `messages` subcollection), `activityLogs`, `settings`, `supportTickets`, `gamification` (+ `activities` subcollection).

---

## 1. Authentication & onboarding

### 1.1 Registration (`/register`)
Two-step wizard (`register/page.tsx`):
1. **Choose role** — Job Seeker / Employer / Business Owner / Supplier / Service Provider.
2. **Basic details** — name, phone (+91), email, password (min 6) **or** "Continue with Google".

On submit → `AuthContext.createAccount(email, password, name, role)`:
- Firebase Auth `createUserWithEmailAndPassword` → `updateProfile(displayName)`.
- Writes `users/{uid}` doc: `{ email, displayName, role, isVerified:false, createdAt, updatedAt }`.
- `onAuthStateChanged` fires → context loads the profile → a `useEffect` redirects by role.

**Role-based redirect (used in register & login):**
```
admin / super_admin      → /admin/dashboard
employer / business_owner → /employer/dashboard
everyone else            → /seeker/dashboard
```

### 1.2 Email/password login (`/login`, "Email" tab)
`signInWithEmail` → `signInWithEmailAndPassword` → context updates `user` → role redirect. Supports `?redirect=` to return to a deep link.

### 1.3 Phone OTP login (`/login`, "Mobile OTP" tab)
1. Enter 10-digit number → `sendPhoneOTP('+91…','recaptcha-container')` builds an invisible `RecaptchaVerifier` and calls `signInWithPhoneNumber` → returns a `ConfirmationResult`.
2. Enter 6-digit code → `verifyPhoneOTP(confirmation, otp)` → `confirmation.confirm()`.
3. First time only → seeds `users/{uid}` with `role:'job_seeker'`.

### 1.4 Google sign-in (`/login` & `/register`)
`signInWithGoogle` → `signInWithPopup`. First time only → seeds `users/{uid}` with `role:'job_seeker'`, copying name/photo/email from Google.

### 1.5 Admin login (`/admin/login`)
Separate page: `signInWithEmailAndPassword` → read `users/{uid}.role` → if `admin`/`super_admin` go to `/admin/dashboard`, otherwise `signOut` and show "Access Denied."

### 1.6 Route guarding & logout
- `useRequireAuth(allowedRoles?, redirectTo='/login')` (`hooks/useAuth.ts`): waits for `loading`, redirects unauthenticated users to login, and bounces wrong-role users to their own dashboard. **Currently only the Employer layout uses it.**
- **Logout:** employer/seeker layouts call Firebase `signOut()` then `/login`; admin layout only navigates to `/login` (see Gaps).

---

## 2. Public / discovery workflows

### 2.1 Home → search (`/`)
Hero search hub → navigates to `/jobs?search=…&location=…` (jobs page reads those query params on mount).

### 2.2 Browse jobs (`/jobs`)
- Loads jobs once: `getDocs(query(jobs, where('status','in',['active','approved'])))`.
- **Client-side** filtering by search text, location, job type, category. (Sort dropdown is present but not yet wired.)
- Each card → `Apply Now` deep-links to `/jobs/{id}`; bookmark toggles save; "Company" links to the company page.

### 2.3 Job detail + apply (`/jobs/[id]`)
`JobDetailPageClient`:
1. Fetch `jobs/{id}`; check `savedJobs` and `applications` to set `saved` / `hasApplied`.
2. **Apply** opens a modal → pick a resume (from `seekerProfiles.resumes`) + optional cover letter → writes an `applications` doc `{ jobId, companyId, seekerId, seekerName, resume…, coverLetter, status:'applied', createdAt }` → `hasApplied=true`.
3. Alternative contact paths: **WhatsApp Apply** (`wa.me` deep link) and **Call HR** (`tel:`).
4. Save/unsave job; "Create Job Alert" link.

### 2.4 Businesses directory (`/businesses`, `/businesses/[category]`, `/company/[slug]`)
Public company directory and per-company profile page (resolved by slug via `getCompanyBySlug`). Company registration also available at `/company/register`.

---

## 3. Job Seeker portal (`/seeker/*`)

| Workflow | Route | What happens |
|---|---|---|
| **Dashboard** | `/seeker/dashboard` | Live counts via `useSeekerStats` (applied, saved, interviews, profile views) + recent applications + gamification widget. |
| **Profile** | `/seeker/profile` | Build seeker profile (photo upload to Storage, contact, skills, experience, education) → saved to `seekerProfiles/{uid}`. |
| **Resume** | `/seeker/resume` | Upload resume files to Storage; list stored in profile. |
| **Resume Builder** | `/seeker/resume/builder` | Auto-fill from profile → save a generated resume into the profile. |
| **Applications** | `/seeker/applications` | Track every application and its status (via `WorkflowPage`). |
| **Saved Jobs** | `/seeker/saved-jobs` | List/remove saved jobs (`savedJobs` where `userId`). |
| **Job Alerts** | `/seeker/job-alerts` | Create/toggle/delete `jobAlerts` (title, filters) — notifies when matching jobs appear. |
| **Interviews** | `/seeker/interviews` | See scheduled interviews (`interviews` where `seekerId`). |
| **Messages** | `/seeker/messages` | Real-time chat with employers (see §6.2). |
| **Notifications** | `/seeker/notifications` | Full notification list + mark-all-read. |
| **Rewards** | `/seeker/rewards` | Points, badges, achievements, leaderboard (see §6.3). |
| **AI Coach / Skills** | `/seeker/ai-coach`, `/seeker/skills` | Coaching content & skill development tracking. |
| **Subscription** | `/seeker/subscription` | View/select plans (Free/Basic/Premium/Enterprise from `constants.ts`). |

**Seeker hiring journey (happy path):**
```
Register → Build profile → Upload/build resume → Search jobs → Apply
→ (employer shortlists) → Interview scheduled → Selected/Hired
   ↑ notifications + gamification points fire at each step
```

---

## 4. Employer portal (`/employer/*`)
Guarded by `useRequireAuth(['employer','business_owner'])`. The layout resolves the employer's company via `companies where ownerId == uid`.

### 4.1 Company profile (`/employer/company-profile`)
Create or edit the company. **Create** writes `companies/{id}` with `verificationStatus:'pending'`, `isActive:false`, `ownerId` → awaits admin approval. **Edit** updates the doc. Logo/cover/gallery upload to Storage.

### 4.2 Post a job (`/employer/post-job`)
4-step wizard: Job Details → Requirements (skills, experience, education) → Compensation (salary, benefits, boosts) → Preview. On post → `createDocument('jobs', {…, status:'pending', isActive:false, postedBy:uid})` + `logActivity`. **Requires an existing company profile.** Job goes live only after admin approval.

### 4.3 Manage jobs (`/employer/jobs`)
List company jobs (newest first). Per-job actions: **pause/resume** (`status` + `isActive`), **delete**, view counts, edit. Tabs by status (active/paused/draft/closed/expired).

### 4.4 Candidates pipeline (`/employer/candidates`)
- Loads `applications where companyId` (+ each seeker's profile/user doc on expand).
- Pipeline tabs: All → New(applied) → Shortlisted → Interview → Selected → Rejected, plus **AI Recommended**.
- **Status change:** `updateApplicationStatus(appId, status, note?)` writes `status`, a `statusTimestamps.{status}` timestamp, and optional employer note.
- **Schedule interview:** creates an `interviews` doc, sets application → `interview_scheduled`, and notifies the seeker.
- **AI matching:** `calculateMatch(job, seeker)` scores all seeker profiles (skills 50% / experience 30% / location 20%) and ranks the top 10.
- **Invite candidate:** sends a `job_alert` notification linking to the job.

### 4.5 Other employer workflows
| Workflow | Route | What happens |
|---|---|---|
| **Talent Search** | `/employer/talent-search` | Search seeker profiles, send invites. |
| **Interviews** | `/employer/interviews` | Mark interviews completed/cancelled; send reminders (notification). |
| **Leads** | `/employer/leads` | Manage inbound `leads`; update status (new→contacted→qualified→converted/lost). |
| **Reviews** | `/employer/reviews` | View company reviews; post a reply. |
| **Messages** | `/employer/messages` | Real-time chat with candidates (§6.2). |
| **Billing / Subscription** | `/employer/billing`, `/employer/subscription` | Plan selection (payment gateway not yet implemented). |
| **Reports** | `/employer/reports` | Hiring analytics via `getEmployerAnalytics` (funnel, time-to-hire, sources). |

---

## 5. Admin portal (`/admin/*`)

### 5.1 Dashboard (`/admin/dashboard`)
Platform KPIs via `usePlatformStats` — live counts of users, verified businesses, active jobs, applications, leads, revenue (active subscriptions), and pending queues (pending businesses / inactive jobs / unverified users).

### 5.2 Approval workflows (the core of admin)
- **Businesses** (`/admin/businesses`): tabs All/Pending/Verified/Rejected/Featured.
  - **Approve** → `approveCompany` sets `verificationStatus:'verified'`, `isActive:true`, notifies owner, logs activity.
  - **Reject** → `rejectCompany(reason)` sets `rejected`, `isActive:false`, notifies owner.
  - **Feature / Premium** toggles.
- **Jobs** (`/admin/jobs`):
  - **Approve** → `approveJob` sets `isActive:true`, `status:'active'`, notifies `postedBy`.
  - **Reject** → `rejectJob` sets `isActive:false`, `status:'rejected'`.

### 5.3 Other admin workflows
| Workflow | Route | What happens |
|---|---|---|
| **Users** | `/admin/users` | Verify users (`verifyUser`), change roles (`updateUserRole`) — both notify + log. |
| **Leads** | `/admin/leads` | Review/assign platform leads. |
| **Services** | `/admin/services` | Approve/manage service listings. |
| **Subscriptions** | `/admin/subscriptions` | View revenue & active plans. |
| **Ads** | `/admin/ads` | Manage `advertisements`. |
| **Reviews** | `/admin/reviews` | Moderate reviews. |
| **Notifications** | `/admin/notifications` | **Broadcast** a title+message to users. |
| **Reports** | `/admin/reports` | Platform analytics. |
| **Security / Settings** | `/admin/security`, `/admin/settings` | Audit/`activityLogs`, platform settings (`settings` collection). |

---

## 6. Cross-cutting system workflows

### 6.1 Notifications pipeline
`createNotification({userId,type,title,message,actionUrl})` → `notifications` doc `{read:false,createdAt}`.
- `NotificationContext` live-subscribes to `notifications where userId == me orderBy createdAt` → drives the **bell + unread badge** in every portal header.
- Click a notification → `markNotificationRead` and navigate to `actionUrl`. "Mark all read" → `markAllNotificationsRead`.
- Notifications are fired automatically by: job apply, application status change, interview scheduling, candidate invite, company/job approval & rejection, user verification, badge earned.

### 6.2 Real-time chat (`useChat`, `useConversationList`)
1. **Start:** `createConversation({participants:[me,other], names, roles, jobId?})` — dedupes existing threads, seeds `unreadCounts`, `typingUsers`, `status:'active'`.
2. **Messages:** live `onSnapshot` on `conversations/{id}/messages orderBy createdAt`. `sendChatMessage` appends a message and updates the parent's `lastMessage`/`lastMessageAt`.
3. **Typing indicators:** `setTypingStatus` toggles the sender in `typingUsers` (auto-clears after 3s).
4. **Read receipts:** incoming messages auto-mark read via `markMessagesRead`.
5. **List:** `useConversationList` shows active threads sorted by last message, with per-user unread totals.

### 6.3 Gamification (`firestoreService` gamification section)
- **Points:** `awardPoints(uid, type, points, desc)` updates `gamification/{uid}.rewards` and logs an `activities` entry. Point values defined in `constants.POINT_VALUES` (apply +5, resume upload +25, interview +50, offer +500, daily login +2, …).
- **Badges:** `awardBadge` appends to `badges[]` and notifies the user. Catalog in `constants.BADGE_DEFINITIONS`.
- **Achievements:** `updateAchievementProgress` tracks progress toward `constants.ACHIEVEMENT_DEFINITIONS` (e.g. "5 applications", "100 points").
- **Leaderboard:** `getLeaderboard` ranks `gamification` by `rewards.monthlyPoints`.

### 6.4 Activity log / audit
`logActivity({userId,userName,action,target,targetId})` → `activityLogs` doc with server timestamp. Admin reads recent logs via `getActivityLogs`. Fired on job posts and every admin action.

---

## 7. Status state machines

**Application** (`applications.status`):
```
applied → shortlisted → interview_scheduled → selected
   └──────────────┴────────────────┴──────────→ rejected
```
Each transition stamps `statusTimestamps.{status}` and can notify the seeker.

**Job** (`jobs.status` / `isActive`):
```
(post) pending,isActive=false → (admin approve) active,isActive=true
                              → (admin reject)  rejected,isActive=false
employer can: active ↔ paused, or closed/expired/draft
```

**Company** (`companies.verificationStatus` / `isActive`):
```
(create) pending,isActive=false → (admin approve) verified,isActive=true
                                → (admin reject)  rejected,isActive=false
admin can also toggle: isFeatured, isPremium, verificationBadges
```

**Lead** (`leads.status`): `new → contacted → qualified → converted | lost`
**Interview** (`interviews.status`): `scheduled → completed | cancelled | no_show`

---

## 8. End-to-end "golden path"
```
Employer registers → creates company → admin verifies company
Employer posts job → admin approves job → job appears in /jobs
Seeker registers → builds profile + resume → applies to job
Employer reviews candidate → shortlists → schedules interview (seeker notified)
Interview completed → employer marks "selected" (seeker notified, points awarded)
Seeker & employer chat throughout via Messages; activity logged for admin.
```

---

## 9. Gaps that currently break these workflows
Cross-referenced with `ANALYSIS_REPORT.md`. The workflows above describe **intended** behavior; these are where the implementation falls short today:

- **Apply → employer notification** doesn't fire from the Job Detail apply path (it bypasses `applyToJob`), and `applyToJob` itself sends the notification to the company id instead of the owner. Employers aren't alerted to new applicants.
- **Application count** (`applicationsCount`) is never incremented on apply, so it stays 0.
- **Job deadline** is dropped on save and read from a different field → always "N/A".
- **Company links** from job cards use the job id, not the company slug; and `company-profile` create doesn't generate a `slug`, so new companies can't be found at `/company/[slug]`.
- **Conversation list** reads the whole `conversations` collection, which Firestore rules block for non-admins → chat list can fail.
- **Leaderboard** reads all `gamification` docs, which rules block for normal seekers.
- **Admin & seeker routes** aren't auth-guarded (only employer is).
- **Composite indexes** for application/notification/conversation queries aren't deployed → those lists can throw at runtime.
- **Supplier / Service Provider** roles have no portal.
- **Payments** (employer billing) are a "coming soon" stub.

See `ANALYSIS_REPORT.md` for severities and fixes.
