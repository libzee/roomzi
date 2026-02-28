# Product Backlog

## Tenant Vetting

### 1. Require tenants to complete a credit check before matching
**As a** landlord, **I want** tenants to complete a credit check before matching **so that** I can filter out high-risk applicants early.

**Acceptance Criteria:**
- Tenant must complete credit check before their profile is visible to landlords.
- Landlord dashboard indicates credit check status of each tenant.
- Landlords can filter out tenants who have not passed the credit check.
- Tenants receive notification about credit check completion and results.

### 2. Verify employment and income
**As a** landlord, **I want** tenants to verify their employment and income **so that** I can ensure they can afford the rent.

**Acceptance Criteria:**
- Tenant must upload or connect verified proof of employment and income (e.g., pay stubs, employer verification).
- Employment and income status is clearly visible on tenant profiles.
- Landlords can filter tenants by verified income level.
- Tenants receive clear instructions on how to verify employment and income.

### 3. Display past rental history and reference checks
**As a** landlord, **I want** to see past rental history and reference checks on a tenant profile **so that** I can trust their reliability.

**Acceptance Criteria:**
- Tenant profile includes verified rental history summaries and references.
- Landlord can access contact information of references (if tenant allows).
- Landlord is alerted if rental history contains negative flags (e.g., eviction).
- Tenants can upload reference letters or provide contacts for reference checks.

### 4. Upload identity documents for verification
**As a** tenant, **I want** to upload identity documents (e.g., driver’s license, passport) for verification **so that** landlords know I’m who I claim to be.

**Acceptance Criteria:**
- Tenants can securely upload multiple types of ID documents.
- System verifies document authenticity (manual or automated verification).
- Landlords can view verified tenant identity status.
- Tenants receive confirmation once ID is verified.

---

## Swipe-Based Matching

### 5. Create detailed room listing for swiping
**As a** landlord, **I want** to create a detailed room listing (photos, location, rent, rules) **so that** tenants can swipe on my offer.

**Acceptance Criteria:**
- Landlord can add multiple photos, address/location, rent amount, and house rules.
- Listing previews show all critical details clearly to tenants.
- Listings are published and available for tenants to swipe on immediately after creation.
- Landlords can edit or remove listings at any time.

### 6. Set search preferences to filter room feed
**As a** tenant, **I want** to set my search preferences (budget, location radius, house rules) **so that** I only see rooms that fit my needs.

**Acceptance Criteria:**
- Tenant can specify budget range, preferred location radius (map or distance), and house rule preferences.
- Tenant’s swipe feed only includes rooms matching these preferences.
- Preferences can be updated anytime.
- Preferences are saved and used for notifications.

### 7. Swipe on tenant profiles that meet criteria
**As a** landlord, **I want** to swipe right on tenant profiles that meet my criteria **so that** I focus on the best candidates.

**Acceptance Criteria:**
- Landlord can swipe right or left on tenant profiles.
- Profiles display tenant’s verified vetting info, preferences, and photos.
- Right-swiped tenants are added to a “liked” list for landlord review.
- Landlord cannot swipe more than once on the same tenant profile.

### 8. Swipe on room listings that match preferences
**As a** tenant, **I want** to swipe right on rooms that match my preferences **so that** I find my ideal living situation quickly.

**Acceptance Criteria:**
- Tenant can swipe right or left on room listings.
- Listings show all relevant details upfront.
- Right-swiped rooms are saved in a “liked” list for tenant review.
- Swipe feed excludes listings outside tenant preferences.

### 9. Notify on mutual match
**As a** landlord or tenant, **I want** to get notified when there’s a mutual match **so that** I can begin the application process immediately.

**Acceptance Criteria:**
- Both parties receive a push notification and in-app alert on mutual right-swipes.
- Match triggers unlocking of messaging/chat functionality.
- Matches are stored in a “matches” list accessible to both users.
- Notification includes basic profile info and next steps.

---

## Integrated Communication & Leasing

### 10. In-app chat for matched users
**As a** landlord, **I want** an in-app chat to communicate with matched tenants **so that** all my messages and history stay in one place.

**Acceptance Criteria:**
- Chat is only available between mutually matched users.
- Message history is saved and accessible anytime.
- Notifications alert users to new messages.
- Users can send text, images, and attachments securely.

### 11. Schedule viewings through chat
**As a** tenant, **I want** to schedule viewings directly through chat **so that** I don’t have to leave the platform or exchange personal contact info.

**Acceptance Criteria:**
- Chat interface includes an option to propose and accept viewing times.
- Calendar integration to avoid double booking.
- Both parties receive confirmation notifications.
- Scheduled viewings appear in user’s profile or dashboard.

### 12. Send digital rental agreement template for e-signature
**As a** landlord, **I want** to send a digital rental agreement template for e-signature **so that** paperwork is completed faster and securely.

**Acceptance Criteria:**
- Landlord can generate and send a lease agreement from a template.
- Tenant receives a notification and can review the lease online.
- Lease can be signed digitally with legally binding e-signature.
- Both parties receive a copy of the signed agreement.

### 13. Review and sign lease online
**As a** tenant, **I want** to review and sign the lease online **so that** I can finalize my move-in without printing or scanning documents.

**Acceptance Criteria:**
- Lease is fully accessible and readable on all devices.
- Tenant can sign using a secure e-signature process.
- Confirmation email with signed lease is sent immediately.
- Tenant can download or print the signed lease.

---

## Rent Tracking & Payments

### 14. Set up automated monthly rent reminders
**As a** landlord, **I want** to set up automated monthly rent reminders for tenants **so that** I reduce late payments.

**Acceptance Criteria:**
- Landlord can configure reminder schedule (e.g., days before due date).
- Tenants receive automated reminders via email and/or push notifications.
- Reminder settings can be adjusted or turned off by landlord.
- System logs when reminders are sent.

### 15. Pay rent securely through the platform
**As a** tenant, **I want** to pay rent securely through the platform **so that** I have a clear, timestamped payment record.

**Acceptance Criteria:**
- Platform supports multiple secure payment methods.
- Payments are confirmed with timestamped receipts.
- Payment history is accessible in tenant’s account.
- Tenants receive notifications for successful or failed payments.

### 16. View rent payment dashboard
**As a** landlord, **I want** to see a dashboard of upcoming, pending, and paid rents **so that** I can manage my cash flow.

**Acceptance Criteria:**
- Dashboard displays rent payment status per tenant and overall.
- Statuses include upcoming due, pending payment, late, and paid.
- Dashboard updates in real time or with minimal delay.
- Landlord can filter and export payment data.

### 17. Download year-end rent report
**As a** landlord, **I want** to download a year-end rent report **so that** I can simplify my tax filing.

**Acceptance Criteria:**
- Report summarizes all rent payments received within the calendar year.
- Report is downloadable in common formats (PDF, CSV).
- Report includes tenant names, payment dates, and amounts.
- Report generation is available anytime after year-end.

---

## Property Management Tools

### 18. Submit maintenance requests with photos and descriptions
**As a** tenant, **I want** to submit maintenance requests with photos and descriptions **so that** I can report issues without email or phone calls.

**Acceptance Criteria:**
- Tenant can create maintenance tickets with text description and multiple photos.
- Tickets are submitted directly through tenant dashboard or app.
- Confirmation is sent upon submission.
- Tenants can view status and history of their requests.

### 19. Track maintenance request status
**As a** landlord, **I want** to track the status of maintenance requests (open, in progress, resolved) **so that** nothing slips through the cracks.

**Acceptance Criteria:**
- Landlord dashboard shows all maintenance requests with current status.
- Landlord can update status and add notes.
- Tenants receive notifications on status changes.
- System logs timestamps for all status updates.

### 20. Securely store scanned documents
**As a** landlord, **I want** to store scanned documents (leases, receipts, inspection reports) in a secure archive **so that** I can retrieve them anytime.

**Acceptance Criteria:**
- Landlord can upload, categorize, and securely store documents.
- Documents can be searched and retrieved quickly.
- Access control restricts document visibility as needed.
- Documents are encrypted and backed up regularly.

---

## Regulatory Guidance & Localization

### 21. Provide Ontario LTB procedure tips
**As a** landlord, **I want** tips on Ontario’s Landlord and Tenant Board procedures **so that** I understand my eviction rights and timelines.

**Acceptance Criteria:**
- Platform provides a dedicated section with up-to-date Ontario-specific landlord info.
- Tips are easy to understand and include links to official resources.
- Information is searchable and regularly updated.
- Landlord users can access this guidance anytime.

### 22. Review Ontario standard room-rental lease template
**As a** tenant, **I want** to review Ontario’s standard room-rental lease template **so that** I know my rights before signing.

**Acceptance Criteria:**
- Tenants can access and download the official Ontario standard lease template.
- Platform provides explanations or FAQs about key lease terms.
- Template is kept up to date with legislative changes.
- Tenants can compare lease terms with their actual agreement.

---

## Platform & Account Management

### 23. Manage user profile and preferences
**As a** landlord or tenant, **I want** to manage my profile (photo, bio, preferences) **so that** others get an accurate sense of who I am.

**Acceptance Criteria:**
- Users can upload and update profile photos and bio text.
- Users can set and edit preferences (search, communication, notifications).
- Changes are saved immediately and reflected in profiles visible to others.
- Users can preview their public profile.

### 24. Moderate user-reported content
**As an** administrator, **I want** to moderate user-reported profiles or messages **so that** the community remains safe and trustworthy.

**Acceptance Criteria:**
- Admin dashboard displays reported profiles/messages with context.
- Admin can suspend or ban users based on reports.
- Admin actions are logged for accountability.
- Users receive feedback if their report leads to action.
