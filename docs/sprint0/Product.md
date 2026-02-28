# Roomzi

## Product Description

Roomzi is a mobile-first platform that addresses Ontario’s growing shared-accommodation challenges by uniting tenant discovery, rigorous screening, and lightweight property management in one intuitive app. As housing costs and interest rates climb, many homeowners become “accidental landlords” but lack the tools to reliably vet and manage tenants. Traditional channels like Facebook Marketplace or Kijiji offer broad reach but no screening, standalone services like SingleKey or TransUnion SmartMove provide credit and background checks but no matchmaking or ongoing management, and full-service agents charge prohibitive commissions for single-room rentals. Roomzi solves these pain points by:

1. **Delivering Fast, Trusted Matches**  
   - Homeowners swipe through pre-vetted tenant profiles (verified credit, income, rental history, and identity checks).  
   - Tenants swipe through room listings that match budget, location, and house-rule preferences.  
   - Mutual matches trigger push-and-in-app notifications and unlock secure chat.

2. **Enforcing Rigorous Screening**  
   - Credit checks via a mock credit-bureau integration.  
   - Employment and income verification (e.g., pay-stub uploads).  
   - Reference checks and rental-history summaries.  
   - ID document uploads with automated/manual authenticity reviews.  
   - Vetting status dashboard and filter controls for landlords.

3. **Streamlining Post-Match Management**  
   - Built-in chat and viewing scheduler with calendar integration and ICS export.  
   - Digital lease-generation and legally binding e-signature integration (e.g., DocuSign).  
   - Rent tracking with automated reminders, timestamped receipts, and year-end exportable financial reports.  
   - Maintenance ticketing (text + photo uploads) with lifecycle tracking (Open → In-Progress → Resolved).  
   - Secure document archive (leases, receipts, inspection reports) with full-text search.  

By combining these core pillars—matchmaking, screening, and lightweight property management—Roomzi transforms renting out a spare room into a simple, low-risk way to earn income, while giving tenants a fast, transparent path to their next long-term home.

---

## Prioritized Feature List

Below is a breakdown of Roomzi’s features, organized by priority for an MVP launch versus subsequent phases.

### 1. High Priority (MVP)

These features deliver the core value proposition: fast, trusted matches and basic post-match functionality.

#### 1.1 Tinder-Style Matchmaking
- **Swipe Interface**  
  - Swipe left/right on tenant profiles (for landlords) or room listings (for tenants).  
  - Preview cards optimized for a continuous swipe feed.
- **Mutual-Match Detection**  
  - Push and in-app notifications when both parties swipe “like.”  
  - “Liked” lists so users can revisit favorites before match.

#### 1.2 Tenant Vetting (Mocked for MVP)
- **Credit-Bureau API Integration (Mocked)**  
  - Simulated credit-check workflow (placeholder for future TransUnion integration).  
- **Employment & Income Verification**  
  - Upload pay-stubs and income documents.  
- **Rental History & Reference Checks**  
  - Simple form-based workflow to collect previous landlord references.  
- **ID Document Upload**  
  - Secure upload (e.g., driver’s license, passport) with an initial manual authenticity review.  
- **Vetting Status Dashboard**  
  - Landlords can filter tenant profiles by “Pending,” “In-Review,” “Verified,” or “Flagged.”  

#### 1.3 Profile & Preference Management
- **User Onboarding & Authentication**  
  - OAuth (Google, Apple) + phone and email sign-up.  
  - Face ID for quick re-authentication.
- **Role Toggle**  
  - Switch between Landlord ↔ Tenant ↔ “Just Browsing.”  
- **Profile Setup**  
  - Profile photo, bio, background details (work, lifestyle preferences).  
  - Search preferences: budget slider, location-radius map picker, house-rule filters.  
- **Notification Settings**  
  - Email and push notifications for matches, messages, viewing requests, rent reminders.

#### 1.4 Property Listing & Discovery
- **Listing Creation & Management (CRUD)**  
  - Multi-photo upload, room description, rent amount, utilities included.  
  - Instant “available/not available” toggle.
- **Geolocation & Map Integration**  
  - Radius-based map search so tenants can see listings in their desired area.  
- **Listing Preview Cards**  
  - Key details (rent, location, photos, vetting requirements) displayed in a swipe card.

#### 1.5 In-App Communication & Scheduling
- **Secure Chat**  
  - WebSocket-powered real-time messaging (text, images, attachments).  
  - Chat unlocked only upon mutual match.  
  - Message notifications and read receipts.
- **Viewing Scheduler**  
  - Calendar integration for landlords and tenants.  
  - Conflict-free booking with ICS export for personal calendars.

#### 1.6 Digital Leasing & E-Signatures
- **Template Library**  
  - Standard Ontario room-rental lease templates with dynamic field injection (rent amount, dates, parties).  
- **PDF Generation**  
  - Automatically generate a draft lease as a PDF.  
- **E-Signature Integration**  
  - Legally binding e-signature support (e.g., DocuSign or other compliant provider).  
- **Audit Trail**  
  - Timestamped, versioned storage of signed documents.

---

### 2. Medium Priority (Phase 2)

These features enhance management workflows and build on the core MVP to improve retention and upsell.

#### 2.1 Rent Tracking & Payments
- **Automated Monthly Rent Reminders**  
  - Configurable date/time (e.g., 1st of each month).  
  - Push/email reminders to tenants; notifications to landlords on payment status.
- **Landlord Dashboard: Payment Overview**  
  - Upcoming, pending, late, and paid statuses displayed in a sortable table.  
  - Timestamped receipts for every tenant payment.
- **Year-End Financial Reports**  
  - Exportable as CSV or PDF for tax reporting and personal bookkeeping.

#### 2.2 Maintenance & Document Management
- **Tenant Ticketing System**  
  - Tenants submit maintenance requests with text description and multi-photo upload.  
  - Ticket lifecycle tracking: Open → In-Progress → Resolved, with notifications to both parties.
- **Secure Document Archive**  
  - Store leases, receipts, inspection reports, and other documents.  
  - Full-text search and categorization (e.g., “Lease Agreements,” “Inspection Reports,” “Payment Records”).

#### 2.3 Regulatory Guidance & Localization
- **Ontario-Specific LTB FAQs**  
  - Provide up-to-date Landlord & Tenant Board guidance (e.g., eviction timelines, rights/obligations).  
- **Standard Lease Template + Glossary**  
  - Term-by-term glossary explaining legal clauses typical in Ontario room-rental agreements.

#### 2.4 Profile & Preference Enhancements
- **Enhanced Vetting**  
  - Integrate with a real credit-bureau API (e.g., TransUnion) once available.  
  - Automated ID authenticity review via third-party service.

---

### 3. Lower Priority (Phase 3+)

These features round out the platform into a full-service ecosystem and support scalability, analytics, and third-party integration.

#### 3.1 Admin & Analytics Console
- **User-Reported Content Queue**  
  - Reporting mechanism for inappropriate behavior or fraudulent listings.  
  - Suspend/ban actions and audit logs for administrative oversight.
- **Usage Metrics**  
  - Active users, matches/day, payment success rates, average time-to-match.  
- **System Health Dashboard**  
  - API response times, error rates, uptime monitoring.

#### 3.2 Security & Compliance
- **Role-Based Access Control (RBAC)**  
  - Tiered permissions for Admin, Support, Landlord, Tenant.  
- **Rate Limiting & Input Validation**  
  - OWASP best practices for API security (e.g., request throttling, sanitization).  
- **GDPR/PHIPA Considerations**  
  - Data retention policies, user data export, and deletion workflows.

#### 3.3 API & Developer Tooling
- **RESTful API**  
  - OpenAPI (Swagger) specification for all endpoints.  
  - Postman collection for onboarding third-party developers.
- **SDKs / Client Libraries (Optional)**  
  - JavaScript/TypeScript client library for integrating listing/search/chat functionality into external sites.

---