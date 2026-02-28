# Roomzi - Two-sided Rental Marketplace

## Problem

Small landlords in Ontario face significant financial risk when renting spare rooms. Eviction delays and unreliable tenants create income instability, while existing platforms (e.g., Facebook, Kijiji) optimize for listing visibility rather than trust, verification, or payment transparency.

Tenants face parallel issues: scam listings, inactive posts, and unclear lease terms.

We identified two core friction points:
- Lack of structured tenant vetting
- Lack of financial workflow visibility post-match

## Product Vision

Roomzi was designed as a two-sided marketplace focused not only on discovery but on risk reduction and operational management for landlords.

Rather than just facilitating matches, we built tools to:
- Verify tenant credibility
- Structure payment approval workflows
- Manage lease lifecycle
- Track rental income

## Key Product Decisions & Tradeoffs
### Pivot from “Matching App” → “Operational Tool”

Initially scoped as a Tinder-style matching app, we shifted mid-sprint to prioritize:
- Rent tracking
- Payment approval
- Lease lifecycle management

Reason:
User interviews and persona analysis revealed landlords were more concerned about financial risk than discovery friction.

Tradeoff:
Delayed map and advanced matching features to focus on financial trust infrastructure.

### Scope Locking After Sprint 1

After experiencing burndown spikes due to mid-sprint scope changes, we:
- Locked sprint scope earlier
- Accounted for non-working days
- Prioritized bug fixes before new feature expansion

Impact:
Improved delivery consistency in Sprint 4.

## Metrics We Would Track

Although built in an academic setting, the product was designed with measurable marketplace health in mind.

Marketplace Metrics:
- Listing to message conversion rate
- Message to lease offer rate
- Lease offer to lease acceptance rate

Financial Metrics:
- First payment completion rate
- On-time payment rate

Retention Metrics:
- Landlord re-listing rate

**North Star Metric: Successful Lease Conversions with On-Time First Payment**

This metric ensures that the platform does not optimize solely for lease signatures, but for financially reliable outcomes. A lease without on-time payment does not reduce landlord risk, so combining conversion with payment reliability directly aligns the metric with the product’s core value proposition.

## My Ownership

Within a 6-person agile team, I owned the end-to-end rent payment and lease renewal workflows.

This included:
- Designing relational database schema for payments and leases
- Implementing approval-state logic (pending → approved → rejected)
- Ensuring idempotent updates to prevent duplicate financial records
- Defining edge cases (duplicate requests, time formatting issues)
- Integrating landlord and tenant dashboards for state visibility
- Debugging authentication and cross-role data synchronization issues
- Actively contributing to sprint planning and feature tradeoff discussions

**Impact:**
The payment workflow eliminated duplicate financial record errors and improved state consistency across landlord and tenant dashboards, strengthening financial reliability and user trust in the platform.

## What I Learned

- Two-sided marketplaces require trust infrastructure, not just matching
- Scope discipline is critical to predictable velocity
- Financial workflows require clear state transitions and idempotency logic
- Early integration testing prevents merge-heavy sprint endings
- Product decisions must align with primary user risk, not feature excitement

## System Architecture

Roomzi was built using a modular full-stack architecture designed to support multi-role workflows and financial state management.

#### Frontend
- React + TypeScript
- Role-based routing (Landlord / Tenant dashboards)
- Protected routes and state-driven UI updates

#### Backend
- Node.js + Express
- RESTful API design
- Approval-state modeling for payments (pending → approved → rejected)

#### Database
- PostgreSQL with Prisma ORM
- Relational schema supporting:
   - Users
   - Listings
   - Payments
   - Lease lifecycle
   - Chat relationships

#### Authentication & Storage
- Supabase authentication
- JWT-based session handling
- Secure image storage for profiles and listings

The system was designed to maintain state consistency across financial workflows and multi-user interactions.

## Execution & Iteration

Roomzi was developed across multiple agile sprints within a 6-person engineering team.

Key execution learnings:
- Scope changes mid-sprint significantly impacted velocity; we introduced stricter sprint locking and clearer scope definition.
- Financial workflows required idempotent logic to prevent duplicate state transitions.
- Integration testing earlier in the sprint reduced last-minute merge conflicts.
- Reliability and state integrity were prioritized over rapid feature expansion.

These adjustments improved sprint predictability and delivery consistency.

## Running Locally

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher) or yarn
- Mapbox API key (for map functionality)
- Git

### Installation

   ```bash
   git clone https://github.com/libzee/roomzi.git
   cd roomzi
   ```

### Backend Setup

Navigate to the application directory:


   ```bash
   cd backend
   npm install
   npm run dev
   ```

### Frontend Setup

Navigate to the application directory:


   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Backend runs on: 
http://localhost:3001

Frontend runs on: 
http://localhost:8080

Environment configuration details are available in /docs/setup.md
