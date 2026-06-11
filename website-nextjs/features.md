# THENIJOBS Website — Complete Features & Functions Inventory

## 1. Public Pages (No Login Required)

### Home Page (`/`)
| Feature | Implementation |
|---------|---------------|
| Hero Section | Animated hero with tagline, CTA buttons |
| Search Hub | Unified search across jobs, businesses, and services |
| Live Stats Counter | Real-time platform statistics (jobs, companies, users) |
| Categories Section | Browse businesses by industry category |
| Trending Jobs | Latest and trending job listings carousel |
| Featured Businesses | Premium/verified businesses showcase |
| Business Updates | Recent business activity feed |
| Testimonials | User testimonials with ratings |
| Footer | Navigation links, social links, contact info |
| Floating WhatsApp Button | Quick WhatsApp contact CTA |
| Bottom Navigation | Mobile-friendly bottom nav bar |

### Jobs Listing Page (`/jobs`)
| Feature | Implementation |
|---------|---------------|
| Job Search | Search by keyword, title, company, skills |
| Filters | Filter by district, job type, category, salary range |
| Sorting | Sort by newest, featured first, salary |
| Verified Only Toggle | Filter to show only verified employer jobs |
| Job Cards | Cards with company logo, title, location, salary, badges |
| Featured/Urgent/Premium Badges | Visual badges for premium listings |
| Pagination/Infinite Scroll | Browse through all listings |

### Job Detail Page (`/jobs/[id]`)
| Feature | Implementation |
|---------|---------------|
| Full Job Description | Complete job details rendering |
| Company Info Sidebar | Linked company profile summary |
| Apply Button | Direct application with resume attachment |
| Save Job | Bookmark jobs for later |
| Share Job | Share via social/WhatsApp |
| Similar Jobs | Related job recommendations |

### Services / Business Directory (`/services`)
| Feature | Implementation |
|---------|---------------|
| Service Provider Search | Search by name, category, tagline |
| Category Quick Pills | Horizontal scrollable category filter |
| District Filter | Location-based filtering |
| Verified Only Toggle | Show only verified businesses |
| Sort Options | Featured First, Top Rated, Most Jobs, Newest |
| Service Cards | Cards with logo initials, badges, ratings, job counts |
| CTA to Register | "List Your Services Free" call-to-action |

### Businesses Page (`/businesses`)
| Feature | Implementation |
|---------|---------------|
| Business Directory | Full company listing with search |
| Category Filtering | Filter by industry vertical |
| Business Cards | Cards with company info, verification status |

### Business Category Pages (`/businesses/[category]`)
| Feature | Implementation |
|---------|---------------|
| Category-Specific Listing | Filtered view by industry category |
| SEO-Optimized | Dynamic metadata per category |

### Company Profile Page (`/company/[slug]`)
| Feature | Implementation |
|---------|---------------|
| Company Overview | Full company profile with description |
| Company Gallery | Photos and videos |
| Contact Information | Phone, email, WhatsApp, website |
| Social Media Links | Facebook, Instagram, LinkedIn, YouTube |
| Map/Location | Address with district info |
| Verification Badges | GST, mobile, email, business verification |
| Active Jobs | Open positions at this company |
| Reviews | Customer/employee reviews with ratings |
| Lead/Enquiry Form | Contact form for business leads |
| Share Profile | Social sharing |

### Company Registration (`/company/register`)
| Feature | Implementation |
|---------|---------------|
| Multi-Step Form | Guided company registration wizard |
| GST Verification | GST number input and validation |
| Logo/Cover Upload | Image upload to Firebase Storage |
| Category Selection | Industry category picker |
| Contact Details | Phone, email, WhatsApp, website |
| Social Media Links | Add all social profiles |
| Gallery Upload | Multiple image/video upload |
| Service Description | Rich text company description |

### Pricing Page (`/pricing`)
| Feature | Implementation |
|---------|---------------|
| 4 Plans Display | Free, Basic (₹40/mo), Premium (₹100/mo), Enterprise (₹190/mo) |
| Monthly/Annual Toggle | 20% discount for annual billing |
| Feature Comparison | Detailed feature checklist per plan |
| Popular Plan Badge | "Most Popular" highlight on Premium |
| FAQ Accordion | 5 expandable FAQ items |
| All Plans Include | Common features across plans |

---

## 2. Authentication System

### Login Page (`/login`)
| Feature | Implementation |
|---------|---------------|
| Email/Password Login | Standard email auth via Firebase |
| Google Sign-In | OAuth popup via GoogleAuthProvider |
| Role-Based Redirect | Auto-redirect to admin/employer/seeker dashboard |
| Custom Redirect URL | `?redirect=` query parameter support |
| Error Display | Inline error messages |

### Registration Page (`/register`)
| Feature | Implementation |
|---------|---------------|
| 2-Step Wizard | Step 1: Role selection, Step 2: Details |
| 5 User Roles | Job Seeker, Employer/HR, Business Owner, Supplier, Service Provider |
| Tamil Sub-Labels | Bilingual role descriptions (English + Tamil) |
| Email + Password Registration | Firebase createUserWithEmailAndPassword |
| Google Registration | OAuth with auto-profile seeding |
| Phone Number (optional) | +91 prefix with 10-digit input |
| Firestore Profile Seeding | Auto-creates user doc + seeker profile + public profile |
| Progress Bar | Step indicators |

### Forgot Password (`/forgot-password`)
| Feature | Implementation |
|---------|---------------|
| Email Reset | Firebase sendPasswordResetEmail |
| Success Confirmation | "Email Sent!" state with check icon |
| Try Different Email | Reset form option |

---

## 3. Job Seeker Portal (`/seeker/*`)

### Seeker Dashboard (`/seeker/dashboard`)
| Feature | Implementation |
|---------|---------------|
| Profile Strength Meter | Percentage completion indicator |
| Application Stats | Total applied, shortlisted, interviews, offers |
| Recent Applications | Latest application status cards |
| Recommended Jobs | Personalized job recommendations |
| Quick Actions | Apply, Save, Update Profile shortcuts |

### My Applications (`/seeker/applications`)
| Feature | Implementation |
|---------|---------------|
| Application List | All submitted applications with status |
| Status Badges | Applied, Shortlisted, Interview, Selected, Rejected |
| Filter by Status | Filter applications by current status |

### Saved Jobs (`/seeker/saved-jobs`)
| Feature | Implementation |
|---------|---------------|
| Bookmarked Jobs | List of saved/favorited job listings |
| Quick Apply | Apply directly from saved list |
| Remove from Saved | Unsave jobs |

### Profile Management (`/seeker/profile`)
| Feature | Implementation |
|---------|---------------|
| Personal Info | Name, email, phone, address, district |
| Profile Photo | Upload profile picture to Storage |
| Skills Management | Add/remove skills tags |
| Experience History | Add work experiences (company, role, dates) |
| Education History | Add education entries (institution, degree, dates) |
| Open to Work Toggle | Visibility flag for employers |
| Profile Strength Calculator | Auto-calculated completion score |

### Resume Management (`/seeker/resume`)
| Feature | Implementation |
|---------|---------------|
| Resume Upload | PDF upload to Firebase Storage |
| Resume Preview | View uploaded resume |

### Resume Builder (`/seeker/resume/builder`)
| Feature | Implementation |
|---------|---------------|
| Multi-Section Builder | Step-by-step resume creation |
| Sections | Personal info, objective, experience, education, skills, certifications |
| Template Selection | Resume template options |
| Download/Export | Generate downloadable resume |

### Skills Assessment (`/seeker/skills`)
| Feature | Implementation |
|---------|---------------|
| Skills Dashboard | View and manage skills |
| Skill Endorsements | Skills validation system |
| Skill Suggestions | AI-based skill recommendations |

### Job Alerts (`/seeker/job-alerts`)
| Feature | Implementation |
|---------|---------------|
| Create Alerts | Set keyword, location, job type preferences |
| Alert Management | Enable/disable/delete alerts |
| Notification Preferences | Email/push notification settings |

### AI Coach (`/seeker/ai-coach`)
| Feature | Implementation |
|---------|---------------|
| Career Guidance | AI-powered career recommendations |
| Interview Prep | Interview tips and preparation |
| Resume Tips | Resume improvement suggestions |
| Waitlist System | AI coach waitlist registration |

### Interviews (`/seeker/interviews`)
| Feature | Implementation |
|---------|---------------|
| Interview Schedule | Upcoming interview calendar |
| Interview Details | Date, time, mode (in-person/phone/video), location/link |
| Status Tracking | Scheduled, completed, cancelled, no-show |

### Messages (`/seeker/messages`)
| Feature | Implementation |
|---------|---------------|
| Conversations List | All chat threads with employers |
| Real-Time Chat | Message sending/receiving via Firestore |
| Message Types | Text, image, file support |
| Read Receipts | Read/unread status |

### Notifications (`/seeker/notifications`)
| Feature | Implementation |
|---------|---------------|
| Notification List | All notifications with types |
| Types | Job alerts, application updates, interview schedules, system |
| Mark as Read | Individual/bulk read toggling |
| Action URLs | Deep links to relevant pages |

### Settings (`/seeker/settings`)
| Feature | Implementation |
|---------|---------------|
| Account Settings | Email, password, phone management |
| Notification Preferences | Toggle email/push/SMS notifications |
| Privacy Settings | Profile visibility controls |
| Delete Account | Account deletion option |

### Subscription (`/seeker/subscription`)
| Feature | Implementation |
|---------|---------------|
| Current Plan | Display active subscription |
| Plan Comparison | Feature comparison table |
| Upgrade/Downgrade | Plan change options |

---

## 4. Employer Portal (`/employer/*`)

### Employer Dashboard (`/employer/dashboard`)
| Feature | Implementation |
|---------|---------------|
| Company Overview Stats | Active jobs, applications, views, leads |
| Recent Applications | Latest candidate applications |
| Job Performance | Views, applications per job |
| Quick Actions | Post job, view candidates, manage company |

### Post Job (`/employer/post-job`)
| Feature | Implementation |
|---------|---------------|
| Job Creation Form | Title, description, requirements |
| Job Type Selection | Full-time, part-time, internship, remote, WFH, fresher, contract |
| Location & District | Tamil Nadu district picker |
| Salary Range | Min/max with salary type (monthly/yearly/hourly) |
| Skills Tags | Multi-select skill requirements |
| Benefits | Add job benefits list |
| Deadline Setting | Application deadline date |
| Premium/Urgent/Featured Flags | Paid upgrade badges |
| Plan-Based Limits | Cloud Function enforces job posting quotas |

### Manage Jobs (`/employer/jobs`)
| Feature | Implementation |
|---------|---------------|
| Job Listings | All posted jobs with status |
| Status Management | Active, paused, closed, pending |
| Edit Job | Modify existing job postings |
| Delete Job | Remove job listings |
| Application Count | Per-job application metrics |

### Candidates / Talent Search (`/employer/candidates`, `/employer/talent-search`)
| Feature | Implementation |
|---------|---------------|
| Candidate Database | Browse public seeker profiles |
| Search & Filter | Search by skills, location, experience |
| Profile Preview | View candidate profiles |
| Shortlist | Save interesting candidates |

### Company Profile (`/employer/company-profile`)
| Feature | Implementation |
|---------|---------------|
| Edit Company Info | Update all company details |
| Gallery Management | Add/remove photos and videos |
| Verification Badges | View and manage verification status |
| Social Links | Manage social media profiles |

### Interviews (`/employer/interviews`)
| Feature | Implementation |
|---------|---------------|
| Schedule Interviews | Create interview slots |
| Interview Calendar | View all scheduled interviews |
| Status Updates | Mark as completed/cancelled/no-show |

### Lead Management (`/employer/leads`)
| Feature | Implementation |
|---------|---------------|
| Lead Dashboard | All incoming business enquiries |
| Lead Status | New, contacted, qualified, converted, lost |
| Lead Details | Contact info, message, source |

### Messages (`/employer/messages`)
| Feature | Implementation |
|---------|---------------|
| Conversation Threads | Chat with candidates |
| Real-Time Messaging | Firestore-backed live chat |

### Reviews (`/employer/reviews`)
| Feature | Implementation |
|---------|---------------|
| Company Reviews | View all reviews for company |
| Reply to Reviews | Respond to customer reviews |
| Rating Overview | Average rating display |

### Reports & Analytics (`/employer/reports`)
| Feature | Implementation |
|---------|---------------|
| Job Performance Reports | Views, applications, conversion rates |
| Lead Analytics | Lead sources, conversion funnel |
| Company Visibility | Profile view trends |

### Billing (`/employer/billing`)
| Feature | Implementation |
|---------|---------------|
| Payment History | Past transactions |
| Invoice Download | Invoice/receipt access |

### Subscription (`/employer/subscription`)
| Feature | Implementation |
|---------|---------------|
| Current Plan Display | Active plan details |
| Upgrade Options | Plan comparison and upgrade |
| Payment Request | Submit payment request for plan change |

### Settings (`/employer/settings`)
| Feature | Implementation |
|---------|---------------|
| Company Settings | Business preferences |
| Notification Preferences | Toggle alert types |
| Account Management | Password, email changes |

---

## 5. Admin Panel (`/admin/*`)

### Admin Dashboard (`/admin/dashboard`)
| Feature | Implementation |
|---------|---------------|
| Platform Overview | Total users, jobs, companies, revenue |
| Real-Time Stats | Live dashboard with Realtime Database |
| Recent Activity | Activity log feed |
| Quick Actions | Approve companies, manage users |

### User Management (`/admin/users`)
| Feature | Implementation |
|---------|---------------|
| User List | All registered users with roles |
| Role Assignment | Change user roles |
| Verification Management | Verify/reject users |
| User Search | Search by name, email, role |
| Delete Users | Remove user accounts |

### Business/Company Management (`/admin/businesses`)
| Feature | Implementation |
|---------|---------------|
| Company List | All registered companies |
| Approval Queue | Pending verification requests |
| Verify/Reject | Approve or reject companies |
| Featured Toggle | Mark companies as featured |
| Premium Toggle | Set premium status |

### Job Management (`/admin/jobs`)
| Feature | Implementation |
|---------|---------------|
| All Jobs | View all posted jobs |
| Job Moderation | Approve/reject/pause jobs |
| Featured/Urgent Flags | Admin-set premium flags |
| Bulk Actions | Mass status updates |

### Lead Management (`/admin/leads`)
| Feature | Implementation |
|---------|---------------|
| All Leads | Platform-wide lead view |
| Assign Leads | Assign leads to team members |
| Lead Analytics | Source and conversion tracking |

### Reviews Management (`/admin/reviews`)
| Feature | Implementation |
|---------|---------------|
| All Reviews | Platform-wide review moderation |
| Approve/Reject | Review content moderation |
| Flag Management | Handle flagged reviews |

### Services Management (`/admin/services`)
| Feature | Implementation |
|---------|---------------|
| Service Listings | All service provider entries |
| Approve/Reject | Service listing moderation |
| Featured Toggle | Promote services |

### Notifications (`/admin/notifications`)
| Feature | Implementation |
|---------|---------------|
| Broadcast Notifications | Send platform-wide announcements |
| Targeted Notifications | Send to specific user groups |

### Ad Management (`/admin/ads`)
| Feature | Implementation |
|---------|---------------|
| Advertisement CRUD | Create/edit/delete ads |
| Ad Types | Banner, sponsored, featured |
| Performance Metrics | Impressions, clicks tracking |
| Status Management | Active, paused, expired |

### Subscription Management (`/admin/subscriptions`)
| Feature | Implementation |
|---------|---------------|
| All Subscriptions | Platform-wide subscription view |
| Payment Requests | Process payment approvals |
| Plan Management | Subscription plan configuration |

### Reports (`/admin/reports`)
| Feature | Implementation |
|---------|---------------|
| Platform Analytics | User growth, revenue, engagement |
| Business Reports | Company performance metrics |
| Job Market Reports | Job posting trends |

### Security (`/admin/security`)
| Feature | Implementation |
|---------|---------------|
| Activity Logs | All admin actions audit trail |
| Security Settings | Platform security configuration |

### Settings (`/admin/settings`)
| Feature | Implementation |
|---------|---------------|
| Platform Settings | Global configuration |
| Subscription Plan Config | Plan pricing and features |
| Franchise Management | District franchise settings |

---

## 6. Cloud Functions (Firebase Functions v2)

| Function | Purpose |
|----------|---------|
| `healthCheck` | API health check endpoint |
| `syncMobileVerification` | Syncs Firebase Auth phone verification to Firestore user/company docs |
| `createJobPosting` | Server-side job posting with plan-based limits, quota enforcement |

### createJobPosting Enforces:
- User must be `employer` or `business_owner`
- Mobile number must be verified
- Company ownership validation
- Plan-based job posting limits (Free: 1, Basic: 3, Premium: 15, Enterprise: unlimited)
- Featured/Urgent/Premium badge plan restrictions
- Auto-generates slug, sets initial status to `pending`
- Writes activity log entry

---

## 7. Shared UI Components

| Component | Purpose |
|-----------|---------|
| `Header` | Main navigation bar with auth-aware menu |
| `BottomNav` | Mobile bottom navigation bar |
| `Sidebar` | Portal sidebar with role-based menu items |
| `FloatingWhatsApp` | Floating WhatsApp contact button |
| `BrandIcons` | Google, WhatsApp brand icons |
| `Breadcrumb` | Page breadcrumb navigation |
| `Chart` | Recharts-based data visualization |
| `DataTable` | Sortable, filterable data table with pagination |
| `EmptyState` | Placeholder for empty data views |
| `FileUpload` | Drag-and-drop file upload component |
| `LoadingSkeleton` | Shimmer loading placeholders |
| `Modal` | Dialog/modal wrapper (Radix UI) |
| `SearchInput` | Debounced search input with filters |
| `StatsCard` | Metric display card with trend indicators |
| `StatusBadge` | Color-coded status indicators |
| `WorkflowPage` | Step-by-step workflow renderer |

---

## 8. Custom React Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Access auth state, login/logout, role helpers |
| `useCollection` | Real-time Firestore collection subscription |
| `useDocument` | Real-time Firestore document subscription |
| `useAddDocument` | Create Firestore documents |
| `useUpdateDocument` | Update Firestore documents |
| `useDeleteDocument` | Delete Firestore documents |
| `useRealtimeStats` | Real-time dashboard statistics from RTDB |
| `useStorage` | Firebase Storage file upload/download/delete |

---

## 9. SEO & Web Standards

| Feature | Implementation |
|---------|---------------|
| Dynamic Metadata | Per-page title, description, OpenGraph, Twitter cards |
| Sitemap (`/sitemap.xml`) | Auto-generated XML sitemap with all pages |
| Robots (`/robots.txt`) | Search engine crawl directives |
| PWA Manifest | `manifest.json` with app icons, shortcuts |
| Apple Touch Icon | iOS home screen icon |
| Structured OpenGraph | Social sharing previews |

---

## 10. Firebase Services Integration

| Service | Usage |
|---------|-------|
| **Firebase Auth** | Email/password, Google OAuth |
| **Cloud Firestore** | Primary database for all data collections |
| **Realtime Database** | Live dashboard statistics |
| **Cloud Storage** | File uploads (resumes, photos, logos, documents) |
| **Cloud Functions** | Server-side business logic (job posting, verification sync) |
| **Firebase Analytics** | Usage tracking and events |
| **Firebase App Check** | reCAPTCHA Enterprise bot protection |
| **Firebase Hosting** | Static export deployment |

### Firestore Collections (17 total):
`users`, `companies`, `jobs`, `applications`, `reviews`, `seekerProfiles`, `savedJobs`, `leads`, `interviews`, `notifications`, `jobAlerts`, `subscriptions`, `payments`, `paymentRequests`, `services`, `advertisements`, `activityLogs`, `supportTickets`, `serviceRequests`, `conversations`, `publicProfiles`, `platformSettings`, `employerSettings`, `broadcasts`, `aiCoachWaitlist`, `franchises`

---

## 11. Security Rules

| Rules File | Coverage |
|------------|----------|
| `firestore.rules` | 17+ collection-level rules with role-based access (admin, owner, employer) |
| `storage.rules` | File upload rules with size limits (5MB images, 10MB videos/covers) and type validation |
| `database.rules.json` | Realtime Database access control |
| `firestore.indexes.json` | 25 composite indexes for query optimization |

---

## 12. Data Types (TypeScript)

| Type | Fields |
|------|--------|
| `User` | uid, email, displayName, role, adminRole, employerRole, companyId, isVerified |
| `Company` | 40+ fields (basic info, contact, location, social, gallery, verification, analytics, SEO) |
| `Job` | title, description, skills, salary, location, district, jobType, badges, status |
| `JobApplication` | jobId, seekerId, resumeUrl, coverLetter, status, interviewDate |
| `JobSeekerProfile` | skills, experience, education, resumeUrl, profileStrength, isOpenToWork |
| `Review` | rating, title, content, reviewerId, targetId, isVerified, reply |
| `Lead` | type, source, contact info, status, assignedTo |
| `Service` | name, category, pricing, district, status, rating |
| `Subscription` | plan (free/basic/premium/enterprise), status, dates, autoRenew |
| `Advertisement` | type, placement, impressions, clicks, status |
| `InterviewSchedule` | date, time, mode, location, meetingLink, status |
| `ChatMessage` | senderId, message, type, read status |
| `SupportTicket` | subject, category, priority, status, messages |
| `Franchise` | district, managerId, revenue, businesses, users |
| `ActivityLog` | userId, action, target, timestamp |
| `Notification` | type, title, message, read, actionUrl |
