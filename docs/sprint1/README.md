# Roomzi - Sprint 1

## About Roomzi

Roomzi is a modern, full-stack web application designed to revolutionize the rental market in Toronto. The platform bridges the gap between landlords and tenants by providing an intuitive, feature-rich environment for property management and discovery.

### Purpose

- **For Tenants**: Easily discover and search for rental properties with advanced filtering, interactive map views, and direct communication with landlords
- **For Landlords**: Efficiently manage property listings, track rental income, and communicate with potential tenants through a comprehensive dashboard
- **For Everyone**: Streamline the rental process with secure authentication, real-time messaging, and a responsive, user-friendly interface

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/term-group-project-driven-devs.git
   cd term-group-project-driven-devs
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install

   # Copy environment template
   cp config.template.env .env

   # Edit .env with your Supabase credentials:
   # SUPABASE_URL=your_supabase_url
   # SUPABASE_ANON_KEY=your_anon_key
   # DATABASE_URL=your_database_url
   # DIRECT_URL=your_database_url

   # Setup database
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

3. **Frontend Setup**

   ```bash
   cd ../frontend
   npm install

   # Create .env file
   touch .env

   # Add to .env:
   # VITE_SUPABASE_URL=your_supabase_url
   # VITE_SUPABASE_ANON_KEY=your_anon_key
   # VITE_API_BASE_URL=http://localhost:3001
   # VITE_MAPBOX_TOKEN=your_mapbox_token (optional)
   ```

### Running the Application

1. **Start Backend Server**

   ```bash
   cd backend
   npm run dev
   ```

   Backend will run on http://localhost:3001

2. **Start Frontend Server** (in new terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on http://localhost:8080

### Usage

1. Visit http://localhost:8080
2. Sign up or login
3. Select role (Tenant or Landlord)
4. Start browsing properties or create listings

## Features

- **Authentication**: Email/password and social login
- **Property Management**: Create, edit, and browse listings
- **Interactive Maps**: View properties on map
- **Messaging**: Chat between tenants and landlords
- **Search & Filters**: Advanced property search

## Technology Stack

### Frontend

- **React 18.3.1**: Modern React with hooks and concurrent features
- **TypeScript 5.5.3**: Static type checking and enhanced developer experience
- **Vite**: Lightning-fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Radix UI**: Accessible, unstyled UI components
- **React Router v6**: Client-side routing with protected routes
- **React Query**: Server state management and caching
- **React Hook Form**: Performant forms with easy validation
- **Mapbox GL JS**: Interactive maps and geolocation services

### Backend

- **Node.js**: JavaScript runtime for server-side development
- **Express.js**: Fast, unopinionated web framework
- **Prisma 6.9.0**: Next-generation ORM with type safety
- **PostgreSQL**: Robust relational database
- **Supabase**: Backend-as-a-Service for auth and database hosting
- **UUID**: Unique identifier generation
- **CORS**: Cross-origin resource sharing configuration

### Development Tools

- **ESLint**: Code linting and quality enforcement
- **Nodemon**: Development server with hot reloading
- **Git**: Version control and collaboration

## Team - Driven Devs

- Haris Malik
- Jack Tian
- Ishika Vithani
- Liaba Zeeshan
- Amanda Zhu
- Thushshan Rameswaran
