# Platform Specifications: Roles & Workflows

This document outlines the user roles, features, authentication pathways, and business workflows of the platform.

---

# 1. User Roles

The platform is designed with **five dedicated user roles**, each having customized dashboards, features, permissions, and workflows to ensure a seamless experience.

## 1.1 Job Seeker
Users searching for employment opportunities and career growth.

### Key Features:
* Create and manage professional profiles
* Build resumes using AI-powered templates
* Search and apply for jobs
* Filter jobs by location, salary, skill, and category
* Practice mock interviews with AI
* Track job applications and status
* Get personalized job recommendations
* Earn reward points for profile completion, referrals, and activity
* Receive interview notifications and reminders
* Skill assessment and certification support

### Dashboard Access:
* Profile Management
* Resume Builder
* Applied Jobs Tracker
* Interview Schedule
* Rewards & Referral Section
* Saved Jobs

---

## 1.2 Employer
Companies and recruiters looking to hire employees efficiently.

### Key Features:
* Create company profile
* Post and manage job listings
* Define job requirements and eligibility
* View, shortlist, and reject candidates
* AI-powered candidate matching
* Schedule interviews (online/offline)
* Candidate communication system
* Hiring analytics and recruitment reports
* Subscription and featured job promotion options
* Access applicant resume database

### Dashboard Access:
* Company Profile
* Job Posting Management
* Candidate Pipeline
* Interview Scheduler
* Hiring Reports
* Advertisement & Promotions

---

## 1.3 Business Owner
Local business owners who want visibility and customer lead generation.

### Key Features:
* Create business listing/profile
* Showcase products or services
* Add business details, location, timings, and gallery
* Receive direct customer leads
* Promote local offers and deals
* Business verification badge
* Customer inquiry management
* Analytics for profile visits and leads
* Local SEO optimization

### Example Businesses:
* Restaurants, Shops, Salons, Clinics, Educational Centers, Agencies

### Dashboard Access:
* Business Profile
* Leads Management
* Promotions
* Customer Inquiries
* Analytics

---

## 1.4 Supplier & Service Provider
Local professionals and vendors providing services or supplies.

### Key Features:
* Register under service categories
* Create service profile
* Mention expertise, pricing, and availability
* Receive local service requests/leads
* Ratings & review system
* Upload portfolio/work samples
* Manage appointments and bookings
* Service area mapping
* Direct customer communication

### Example Providers:
* Electricians, Plumbers, Carpenters, CCTV Technicians, Building Material Suppliers, Internet Providers, Cleaning Services

### Dashboard Access:
* Service Listings
* Customer Leads
* Appointment Management
* Ratings & Reviews
* Earnings Overview

---

## 1.5 Admin & Super Admin
Platform management team responsible for security, quality control, and operations.

### Admin Responsibilities:
* Verify companies and businesses
* Approve/reject job postings
* Manage users and reports
* Moderate content and advertisements
* Monitor platform activity
* Handle customer support issues
* Review flagged accounts
* Manage categories and permissions

### Super Admin Responsibilities:
* Full platform control
* Role & permission management
* Revenue and subscription management
* Analytics and reporting
* Advertisement management
* System configuration
* Fraud detection & monitoring
* Database and API monitoring
* Backup and security management

### Dashboard Access:
* User Management
* Approval Center
* Reports & Analytics
* Revenue Dashboard
* Ads Management
* Security Controls
* Platform Settings

---

# 2. Authentication & Access Management

## 2.1 User Authentication System
The platform supports secure multi-method authentication to ensure seamless access for all user types.

### Supported Login Methods:
* Email & Password Login
* Phone Number OTP Login
* Role-Based Access Redirection
* Admin-Specific Secure Gateway

---

## 2.2 Login (Email/Password or Phone OTP)

### A. Email Login
Users can log in using their registered email address and password.

#### Workflow:
1. User enters registered email and password.
2. System validates credentials securely.
3. User data is fetched from the database.
4. The system identifies the assigned user role.
5. User is redirected automatically to their respective dashboard.

#### Role-Based Redirection:
* **Job Seeker →** Seeker Dashboard
* **Employer →** Employer Dashboard
* **Business Owner →** Business Portal
* **Supplier & Service Provider →** Service Provider Dashboard
* **Admin / Super Admin →** Admin Portal

#### Security Features:
* Encrypted password storage
* Session management
* Device authentication
* Login activity tracking
* Failed login attempt protection
* Account lock for suspicious activities

---

### B. Phone Login (OTP Authentication)
Users may alternatively log in using mobile number verification.

#### Workflow:
1. User enters registered mobile number.
2. System generates a secure **6-digit One-Time Password (OTP)**.
3. OTP is sent via SMS.
4. User enters the verification code.
5. System validates OTP authenticity and expiration.
6. On successful verification, user authentication is completed.

#### Security Rules:
* OTP expires after **2–5 minutes**
* Maximum retry limit
* Spam prevention cooldown
* Auto-login after verification

---

## 2.3 Admin Portal Gateway
A dedicated and secure authentication gateway exists exclusively for platform administrators.

### Workflow:
1. User accesses the admin login page.
2. Credentials are verified.
3. The system reads the user's role from the database.
4. Access validation occurs.

#### Access Rules:
* If role = **admin** → Access granted
* If role = **super_admin** → Full access granted
* Any other role → Access denied automatically

#### Unauthorized Access Handling:
* User is immediately signed out
* Session token removed
* Security log entry created
* “Access Denied” alert displayed

#### Additional Security Features:
* Two-Factor Authentication (2FA)
* Admin IP/device monitoring
* Login attempt tracking
* Session timeout management

---

# 3. Job Seeker Workflows

## 3.1 Profile Setup & Resume Management
Job seekers create professional profiles to improve visibility and hiring opportunities.

### Seeker Profile Setup
Seekers can build a complete digital career profile including:
* **Personal Information:** Name, profile photo, contact details, district/location, career objective.
* **Education History:** School/College name, degree/course, academic year, percentage/CGPA.
* **Employment History:** Previous companies, designation, responsibilities, work duration.
* **Skills & Expertise:** Technical skills, soft skills, industry expertise, certifications.
* **Additional Sections:** Portfolio links, social profiles, language proficiency, resume preferences.

### Open to Work Toggle
A smart availability switch enables seekers to signal recruiters that they are actively searching for opportunities.
* **Features:** Public visibility to employers, availability status update, priority recommendation boost.

### Resume Builder
The system provides an AI-assisted guided resume builder.
1. Seeker fills structured form data.
2. Resume sections are auto-formatted.
3. Professional templates are applied.
4. Resume preview generated.
5. Export available in **print-ready PDF format** (supporting ATS formatting, multiple templates, Tamil + English support).

---

## 3.2 Job Discovery & Applications

### Job Search Engine
Seekers browse jobs using filters:
* **Search Filters:** Job title, skill keywords, industry category, districts across Tamil Nadu, salary range, experience level, work mode (Remote/Office/Hybrid).
* **Job Types:** Full-Time, Part-Time, Contract, Internship, Freelance, Temporary.

### Job Application Workflow
1. Seeker opens job listing.
2. Uploads resume PDF.
3. Adds short cover letter/message.
4. Clicks “Apply”.
* **System Actions:** Application record created, employer linked, job application count updated, real-time employer notification, application status tracking activated.
* **Application Statuses:** Applied, Under Review, Shortlisted, Interview Scheduled, Rejected, Hired.

---

## 3.3 Gamification & Rewards System
To encourage engagement, seekers earn platform points for milestones.

### Reward Point System
* Profile Completion: 50 Points
* Resume Upload: 20 Points
* Job Application: 10 Points
* Shortlisted: 20 Points
* Interview Attended: 50 Points
* Job Selected: 100 Points
* Referral Signup: 30 Points

### Leaderboards
* **Types:** Weekly Leaderboard, Monthly Leaderboard, District-wise Rankings, Top Skilled Users.
* **Benefits:** Increased profile visibility, recognition badges, special rewards.

---

## 3.4 AI Interview Coach
An AI-powered preparation assistant helps seekers improve interview confidence.
1. User selects job role.
2. AI generates relevant interview questions.
3. User practices answers.
4. AI reviews responses.
5. Recommendations and tips are provided.

---

# 4. Employer & Business Workflows

## 4.1 Business Listing & Company Profile
Employers and businesses can create verified public profiles.
* **Company Profile Includes:** Company logo, cover banner, business description, industry category, links, contact details, coordinates, working hours.
* **Verification Workflow:** Company submits profile → enters review queue → admin verification → approved.
* **Verification Benefits:** Verified badge, higher trust score, better search ranking.

---

## 4.2 Job Posting & Management
Employers create hiring campaigns directly within the platform.
* **Spam Prevention:** Duplicate detection, fake listing checks, content moderation.
* **Approval Process:** Employer submits job → Status becomes **Pending Review** → Admin reviews listing → Job approved/rejected.

---

## 4.3 Candidate Selection Workflow
Employers manage applicants through hiring pipelines (Statuses: Shortlisted, Rejected, Hired).
* **Interview Scheduling:** Choose date & time → Add interview mode (Office location / Video call link) → Send invitation.
* **System Actions:** Email notification, portal notification, calendar reminder.

---

## 4.4 Lead Generation System
Business owners receive customer inquiries directly.
* **Lead Details Include:** Customer name, contact number, requirement description, preferred contact method (Phone, WhatsApp, Email).
* **Lead Workflow:** Customer submits inquiry → Lead assigned automatically → Business owner notified → Lead tracked in dashboard.

---

# 5. Admin Workflows

## 5.1 System Control Panel
Admins oversee complete platform operations.
* **Dashboard Metrics:** Total registrations, active job posts, applications, conversion rate, subscription revenue, service provider signups.
* **Administrative Controls:** Approve companies, approve/reject jobs, manage users, suspend accounts, support tickets, announcements.

---

## 5.2 Content & Advertisement Management
Admins manage monetization and platform content.
* **Advertisement Management:** Banner name, image upload, redirect URL, active status, duration, campaign tracking.
* **Taxonomy Management:** Admins manage job categories, Tamil Nadu districts, service categories, skill tags, and industry sectors.

---

# 6. Shared Communication Workflows

## 6.1 Real-Time Messaging & Chat
Direct messaging system connecting users.
* **Workflow:** Application or inquiry initiated → Chat thread created automatically → Real-time communication enabled.
* **Features:** Instant messaging, online/offline status, read receipts, file sharing, media attachments.

---

## 6.2 Notifications & Alerts System
Instant notifications for critical actions (application updates, shortlisted/rejected, interview schedules, leads, direct messages).
* **Channels:** In-app notification, email alert, SMS alert, push notification.
* **Smart Features:** Real-time updates, notification history, preference controls, priority-based alerts.
