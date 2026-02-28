# Roomzi / Driven Dev — Iteration 1 Review & Retrospective

**Date:** Sunday, June 15, 2025  
**Location:** Online

---

## Process Retrospective

### ✅ What Went Well

The following process-oriented decisions significantly contributed to team efficiency and effectiveness:

- **Clearly Defined Roles:** Team members had a clear understanding of their responsibilities, minimizing confusion and boosting productivity.
- **Platform Decision:** Choosing a web application over a mobile app reduced development complexity and accelerated delivery.
- **Supabase Integration:** Supabase provided essential tools with ease of use, streamlining backend development.
- **Daily Standups:** These meetings enhanced accountability and helped swiftly remove blockers.

### ⚠️ Areas for Improvement

Some decisions did not yield the expected results and will be reconsidered in future iterations:

- **Lack of Monitoring Thresholds:** Absence of defined rate-limiting measures led to recurring 429 errors.
- **Mid-Sprint Scope Shift:** Changing priorities midway caused workflow disruptions and reduced effectiveness.
- **Auth Setup Challenges:** The initial implementation of authentication was inefficient, leading to last-minute changes using Supabase Auth.

### 🔁 Planned Process Changes

To address the above challenges and improve future performance, the team plans to:

- **Manage Rate Limits Strategically:** Avoid simultaneous implementation testing to prevent throttling.
- **Standardize Codebase Structure:** Align on a consistent folder and file structure to reduce merge conflicts.
- **Clarify Scope & Metrics:** Establish well-defined objectives to minimize wasted effort and optimize output.

---

## Product Review

### ✅ Completed Tasks

The following deliverables were successfully completed:

- [Tenant Dashboard](https://roomzi.atlassian.net/browse/SCRUM-40)
- [Landlord Dashboard](https://roomzi.atlassian.net/browse/SCRUM-40)
- [Login/Signup System](https://roomzi.atlassian.net/browse/SCRUM-32)
- [Database & Authentication Setup](https://roomzi.atlassian.net/browse/SCRUM-31)
- [Listing Creation Functionality](https://roomzi.atlassian.net/browse/SCRUM-5)
- Chat Feature *(Bonus – not part of original scope)*

### ❌ Incomplete Tasks

The following planned feature was not completed:

- **Tinder-style Matching:** This was deprioritized due to iteration plan changes and will be considered in future cycles.

---

## Key Takeaways for Next Iteration

- **Standardization:** A unified development approach will enhance collaboration and reduce integration issues.
- **ORM Adoption:** Replace raw SQL queries with **Prisma ORM** for improved query readability, security, and maintainability.
- **Bug Resolution:** Bugs identified during the demo will be triaged and addressed as a top priority in the next sprint.
