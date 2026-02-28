# Release Plan

## Release Name:
**Roomzi v1.2 – Lease Management, Scheduling & Bug Fixes**

---

## Release Objectives

The primary goal of Sprint 3 is to expand Roomzi’s rental platform by introducing lease creation, acceptance, and renewal workflows, integrating a calendar scheduling feature, and fixing key bugs. These updates improve landlord-tenant interactions, streamline rental management, and enhance platform stability.

---

## Our Objectives

### 1. Implement Lease Creation and Acceptance Flows
- **Specific:** Enable landlords to create and send lease agreements; tenants receive top-banner notifications and accept leases to update their dashboard.
- **Measurable:** 100% successful lease visibility and acceptance in testing.
- **Achievable:** Work split between Amanda (landlord) and Thushshan (tenant).
- **Relevant:** Core for formalizing rental agreements.
- **Time-bound:** Completed by **July 20th**.

### 2. Allow for Ability to View Lease Agreement and Lease Renewal
- **Specific:** Allow landlords to view existing leases and initiate renewals on a dedicated page.
- **Measurable:** Accurate rendering of current and upcoming leases.
- **Achievable:** Implemented by Liaba using backend support and merged with Amanda and Thushshan code.
- **Relevant:** Supports lease lifecycle management.
- **Time-bound:** Completed by **July 20th**.

### 3. Add Calendar Scheduling Feature
- **Specific:** Provide tenants and landlords with a calendar to schedule viewings or other rental-related events.
- **Measurable:** Calendar loads, saves, and displays events correctly.
- **Achievable:** Work divided between Ishika (tenant side) and Haris (landlord side).
- **Relevant:** Improves coordination and communication.
- **Time-bound:** Completed by **July 20th**.

### 4. Fix Tenant Profile and Payment Flow Bugs
- **Specific:** Fix tenant profile picture display, move “Make a Payment” flow to the Financial tab, and correct request time formatting.
- **Measurable:** Bug fixes validated with zero regressions.
- **Achievable:** Work split between Ishika and Haris.
- **Relevant:** Essential for tenant experience.
- **Time-bound:** Completed by **July 20th**.

---

## Specific Goals

- Landlord ability to create and send leases  
- Tenant lease banner notification and acceptance  
- Populate tenant “My House” dashboard post-lease acceptance  
- Lease renewal page for landlords to view and renew leases  
- Calendar feature for scheduling and event tracking  
- Move and fix “Make a Payment” logic and request time formatting  
- Enable document uploads for tenants and landlords  
- Fix bugs related to tenant profile picture and account settings  

---

## Metrics for Measurement

- Lease creation and acceptance functionality tested with **100% pass rate**
- Lease renewal page correctly displays **current and upcoming leases**
- Calendar feature **persists and displays scheduled events** reliably
- Tenant profile and payment bugs **resolved with no regressions**
- Document uploads **work for all user roles**
- **No broken or blank screens** in user flows

---

## Release Scope

### Included Features
- Lease creation flow (landlord sends lease, tenant accepts via banner)
- Lease agreement page with current lease info
- Calendar integration for scheduling property-related events
- Bug fixes from previous sprints to improve usability

### Excluded Features
- Real-time chat/messaging functionality (polling used instead)
- AI chatbot integration for tenant-landlord conversation handling
- Map-based property visualization using Mapbox (deferred to future sprint)

---

## Bug Fixes

- Tenant profile picture not displaying properly  
- Request time format in “Make a Payment” flow  
- Relocated and reconnected “Make a Payment” to Financial tab  
- Document upload bugs for tenants and landlords  
- Account settings bugs (UI and persistence issues)  

---

## Non-Functional Requirements

### Performance
- API response time **< 500ms** for CRUD operations
- Dashboard load time **< 3 seconds** across all screen sizes

### Security
- JWT-based session authentication using **Supabase**
- Validation using **Zod** (frontend) and **Prisma** (backend)
- Properly configured **CORS** policies

### Usability
- Responsive design for all devices (desktop, tablet, mobile)
- Role-based dashboard with clear UX flow
- Profile-first onboarding to guide user engagement
- Browser support: **Chrome 90+**, **Firefox 88+**, **Safari 14+**, **Edge 90+**

---

## Dependencies and Limitations

### External Dependencies
- **Supabase:** Authentication service and PostgreSQL database hosting
- **Mapbox:** Interactive map visualization and geocoding services
- **Prisma:** Database ORM and migration management
- **Vercel/Netlify:** Frontend hosting platform (deployment target)

### Known Limitations
- **Database Schema:** Limited to existing Supabase table structure, no major schema changes
- **File Storage:** Images stored as URLs, requires external storage solution
- **Real-time Features:** Chat uses polling, not WebSocket connections
- **Scalability:** Current architecture supports ~1000 concurrent users
