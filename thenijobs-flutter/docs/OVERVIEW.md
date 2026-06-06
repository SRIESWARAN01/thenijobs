# THENIJOBS Platform Overview

This document provides a plain-language description of the THENIJOBS platform — what it is, how its functions and workflows operate, and the roadmap for its future development.

---

## 1. What the App Is

THENIJOBS is a local jobs and business platform built for Theni district and the wider Tamil Nadu market. It rolls four key services into one unified product:

* **Job Portal:** Where candidates search, apply for work, track status, and complete skill development exercises.
* **Business Directory:** Where local companies list themselves to establish an online presence.
* **Service Marketplace:** For verified local service providers (like plumbers or technicians).
* **B2B Lead System:** Where businesses capture customer inquiries.

### Technical Stack:
* **Backend:** Firebase-first architecture using Firebase Authentication, Cloud Firestore database, Cloud Storage (for resumes and images), and Cloud Functions (such as `healthCheck`).
* **Legacy Web Frontend:** Built with Next.js 15, React 19, and Tailwind CSS.
* **Mobile/Cross-Platform Frontend:** Rebuilt in Flutter using Riverpod for state management, GoRouter for navigation, and Clean Architecture for folder structuring.

---

## 2. How the Functions Work

The business logic of the application revolves around a centralized database access layer that guarantees consistent behaviors across different views.

### Reading Functions
These functions query Firestore, filter records, and return structured datasets:
* `getJobs` & `getJobById`: Retrieve active or filtered job listings.
* `getCompanies` & `getCompanyBySlug`: Retrieve business profiles.
* `getServices`: Fetch available local service provider listings.
* `getReviews` & `getLeads`: Track business reviews and B2B inquiries.
* `getInterviews`: Fetch schedules for employers or candidates.
* `getSubscriptions` & `getUsers`: Track plan records and account details.
* `getPlatformStats`, `getEmployerStats`, & `getSeekerStats`: Retrieve summary metrics directly by reading Firestore aggregates without downloading full collections, saving bandwidth and costs.

### Writing Functions
These execute the transactional business logic:
* `applyToJob`: Runs when a seeker applies. It performs four operations atomically:
  1. Creates the application record.
  2. Increments the job's application counter.
  3. Writes an entry to the activity log.
  4. Looks up the company's owner and sends a real-time notification alert.
* `updateApplicationStatus`: Handles status changes by employers (e.g., Applied → Shortlisted → Interview), instantly triggering seeker notifications.
* `saveJob` & `unsaveJob`: Manage job bookmarks.
* `createNotification`, `getNotifications`, `markNotificationRead`, & `markAllNotificationsRead`: Drive the badge notifications visible in the top navigation headers.

### Moderation & Administrative Functions
* `approveCompany` & `rejectCompany`: Determine whether a newly registered company goes live. Rejection requires a reason, and both paths notify the owner.
* `verifyCompany` & `featureCompany`: Manage verification trust badges and featured status.
* `approveJob` & `rejectJob`: Handle quality checks for new job postings.
* `updateUserRole` & `verifyUser`: Admin controls for editing user permissions and verification status.
* `logActivity`: Pairs with administrative writes to maintain a secure audit trail.

### Communication & Gamification Functions
* `createConversation`, `sendChatMessage`, `getConversations`, `markMessagesRead`, & `setTypingStatus`: Power the real-time chat between seekers and employers.
* `awardPoints`, `awardBadge`, `getLeaderboard`, & `updateAchievementProgress`: Drive the points-and-badge gamification mechanics.

---

## 3. How People Move Through the App (Workflows)

### 3.1 Job Seeker Flow
1. **Onboarding:** Registers as a job seeker.
2. **Profile Creation:** Fills out education, experience, and skills. The "profile strength" indicator climbs based on actual fields filled.
3. **Job Search:** Searches active jobs with filters (category, location, working hours) and sorts by newest, salary, or relevance. Bookmarks interesting jobs.
4. **Application:** Applies by uploading a resume PDF and a cover letter. The database attaches the files and triggers employer notifications.
5. **Engagement:** Tracks application status, receives interview requests, chat directly with employers, sets up future job alerts, and earns points to rank on the leaderboard.

### 3.2 Employer & Business Owner Flow
1. **Onboarding:** Registers and submits their business profile. The profile remains pending until approved by an administrator.
2. **Hiring:** Posts job listings with custom deadlines. Once approved, the listing goes live.
3. **Candidate Screening:** Reviews applications inside the candidate pipeline. Downloads candidate resumes, communicates via chat, schedules interviews, and updates application statuses.
4. **Leads & Inquiries:** Manages incoming B2B service leads, replies to customer reviews, and manages billing/subscriptions.

### 3.3 Administrator Flow
1. **System Governance:** Logins through the secure admin gateway.
2. **Moderation:** Reviews pending companies and job posts, verifying and promoting listings.
3. **User Management:** Oversees and manages user accounts and logs activity into the audit database.
4. **Operations:** Tracks leads, ads, platform metrics, and payments.

---

## 4. Roadmap & Future Plans

### A. Razorpay Integration
Integrate Razorpay to handle checkouts and subscription flows. This will enable real gating of featured jobs and premium company listings behind active plans.

### B. Service Provider & Supplier Portals
Re-enable the registration options for service providers and suppliers by building dedicated dashboard widgets, service listings, and lead inbox widgets for them.

### C. Server-Side Candidate Matching
Perform matching computations on the server/functions layer to filter seeker profiles before sending them to the browser, improving database costs and candidate privacy.

### D. Advanced Messaging
Expand the real-time chat system to support offline email/SMS notifications and push messaging.

### E. Matching Background Jobs
Run scheduled cron tasks matching newly posted jobs against saved seeker search criteria to trigger matched alerts.

### F. AI-Powered Coaching and Feedback
Integrate LLMs to provide automated feedback on seeker resumes, recommend skill paths, and compile candidate profile summaries for employers.

### G. Localized Bilingual Interface
Support a complete English / Tamil toggle translation across the entire application interface.
