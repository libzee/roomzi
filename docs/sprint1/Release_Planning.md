# 📘 README: Roomzi v1.0 – Full-Stack Housing Platform

## 🔥 Overview
**Roomzi v1.0** is a full-stack housing platform release integrating **Prisma ORM** with **Supabase**, designed to streamline tenant-landlord interactions. This version emphasizes robust backend structure, user role management, and core platform features for property listing and communication.

---

## 🎯 Objectives

### ✅ Key Goals
1. **Backend Integration**
   - Integrate Prisma with Supabase PostgreSQL.
   - Implement full CRUD operations for user profiles and listings.
   - Build chat functionality for tenant-landlord communication.

2. **Authentication & User Management**
   - Use Supabase Auth UI for login/signup.
   - Enable role-based flows (tenant/landlord).
   - Ensure session persistence and role integrity.

3. **Core Platform Features**
   - Listing creation/editing by landlords.
   - Search and filter capabilities for tenants.
   - Bidirectional messaging system.
   - Filters for house type, location, and tenant-view searching.

4. **Production Readiness**
   - Robust error handling.
   - Strong data validation mechanisms.

---

## 📏 Success Metrics

Success for this release is measured not only through technical benchmarks but also by the qualitative impact it has on user experience, platform stability, and scalability. Below are the key metrics and their contextual importance:

| Metric                          | Target                              | Description |
|----------------------------------|--------------------------------------|-------------|
| Backend API Coverage             | 100% CRUD for 5 entities             | Ensures complete backend support for core entities (users, listings, chats, etc.), enabling full interaction via the frontend. |
| Auth Success Rate                | >95%                                 | Demonstrates high reliability of login/signup flows across multiple devices and providers (email, Google, Facebook). |
| DB Response Time                 | <500ms for listing queries           | Guarantees quick data retrieval to support smooth browsing and filtering experiences for tenants. |
| Role Switching Errors            | 0 unique constraint errors           | Maintains session and data integrity when users switch between tenant and landlord roles, avoiding duplicate data issues. |

### 🎯 Qualitative Goals

- **Smooth Onboarding Experience**: Users should be able to sign up, select a role, and start interacting with the app in under 2 minutes.
- **Error-Free Session Flow**: All authenticated sessions should maintain user state without forcing re-login or breaking navigation.
- **Search Satisfaction**: Tenants should be able to locate relevant listings with minimal effort, using filters that behave intuitively.
- **Reliable Messaging**: Even without real-time sockets, the chat polling mechanism should deliver and retrieve messages accurately within a 3-5 second window.


These metrics, both quantitative and qualitative, are essential benchmarks for deciding future iterations and gauging the platform’s usability and reliability.

----------------------------------|--------------------------------------|
| Backend API Coverage             | 100% CRUD for 5 entities             |
| Auth Success Rate                | >95%                                 |
| DB Response Time                 | <500ms for listing queries           |
| Role Switching Errors            | 0 unique constraint errors           |

---

## 🚀 Release Scope

### ✅ Included Features

#### Backend
- **Prisma ORM**: Fully integrated with type-safe operations.
- **REST APIs**:
  - `/api/landlords`
  - `/api/tenants`
  - `/api/listings` with filters/pagination
  - `/api/chats`
- **UPSERT** logic to avoid unique constraint errors.

#### Frontend
- Supabase Auth UI with social login.
- Role-specific authentication and routing.
- Property management: listing creation, editing, and image upload.
- Advanced search with filters.
- **Mapbox integration** (pending).
- Real-time chat (simulated via polling).
- Mobile-first design using **Tailwind CSS** and **Radix UI**.

#### Authentication & Security
- Multi-provider auth (Email, Google, Facebook).
- Role persistence via localStorage.
- Protected routes and auto session restore.

### ❌ Excluded Features (Due to Sprint Scope)
- True real-time chat (WebSockets not implemented).
- AI-powered landlord-agent chat handling.
- Full implementation of map functionality.

---

## 🛠️ Bug Fixes
- Resolved Prisma unique constraint errors on role switch using UPSERT operations.

---

## 🧩 Non-Functional Requirements

### Performance
- API: ≤500ms
- Initial Page Load: ≤3 seconds
- Indexed DB queries for filters

### Security
- JWT via Supabase
- Zod + Prisma validation
- CORS properly configured

### Usability
- Responsive across desktop, tablet, and mobile.
- Browser support: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## 📦 Dependencies & Limitations

### External Dependencies
- **Supabase**: Auth + DB hosting
- **Mapbox**: Maps & geocoding
- **Prisma**: ORM & migrations
- **Vercel/Netlify**: Frontend deployment

### Technical Constraints
- Cannot modify Supabase DB schema.
- Image storage via external URLs.
- Chat uses polling (not real-time).
- Supports ~1000 concurrent users.

---

## 📝 Notes
> Some features or UI aspects may be less refined due to mid-sprint scope adjustments. Enhancements are planned for future versions.
