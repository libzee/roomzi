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

## Project Overview

Roomzi is a modern web application that connects landlords and tenants in Toronto, making it easy to find rooms, apartments, and houses for rent or list your property. This project is developed as part of CSCC01 - Introduction to Software Engineering at the University of Toronto Scarborough.

### Project Goals

- Create a user-friendly platform for property listings and searches
- Implement an interactive map interface for property visualization
- Develop separate interfaces for landlords and tenants
- Enable comprehensive profile management for landlords and tenants
- Support image uploads and profile customization
- Ensure responsive design for all devices
- Follow software engineering best practices and methodologies

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher) or yarn
- Mapbox API key (for map functionality)
- Git

### Installation

1. Clone the repository:


   ```bash
   git clone https://github.com/yourusername/term-group-project-driven-devs.git
   cd term-group-project-driven-devs
   ```


2. **Backend Setup**

2. Navigate to the application directory:


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

3. Install dependencies:


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

4. [Opitional] Create a `.env` file in the roomzi-home-finder directory:


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

The application will be available at `http://localhost:8080`

## Features

### 🏠 For Landlords

- **Profile Management**: Create and edit comprehensive landlord profiles
- **Property Listings**: Create, manage, and track rental property listings
- **Profile Pictures**: Upload and manage profile pictures with Supabase storage
- **Contact Information**: Manage phone numbers, addresses, and contact details
- **Role Switching**: Seamlessly switch between landlord and tenant roles

### 🏡 For Tenants

- **Property Search**: Browse available rental properties with advanced filtering
- **Profile Management**: Maintain tenant profiles with personal information
- **Property Matching**: Get matched with suitable rental properties
- **Interactive Maps**: View properties on an interactive map interface
- **Role Switching**: Switch to landlord role to list your own properties

### 🛠️ Technical Features

- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Instant updates for profile changes and uploads
- **Secure Authentication**: Supabase-powered authentication with role-based access
- **Image Storage**: Secure image upload and storage with Supabase Storage
- **Database Integration**: PostgreSQL database with Prisma ORM
- **Error Handling**: Comprehensive error handling and user feedback

## Backend Setup

To run the full application with backend functionality:

1. **Start the Backend Server:**

   ```bash
   cd backend
   npm install
   npm run dev
   ```

   Backend will be available at `http://localhost:3001`

2. **Configure Environment Variables:**
   Copy `backend/config.template.env` to `backend/.env` and fill in your values:

   ```
   NODE_ENV=development
   PORT=3001
   FRONTEND_URL=http://localhost:8080
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   DATABASE_URL=your_postgresql_connection_string
   DIRECT_URL=your_postgresql_direct_connection_string
   ```

3. **Initialize Database:**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```



