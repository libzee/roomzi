#!/bin/bash

# Driven Devs Docker Build Script
# This script builds and runs the Docker containers for the Driven Devs application

set -e  # Exit on any error

echo "🚀 Starting Driven Devs Docker Build Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Function to check if .env files exist
check_env_files() {
    # Always try to create .env files from GitHub Secrets first (if available)
    print_status "Attempting to create .env files from GitHub Secrets..."
    
    # Check if we have access to GitHub Secrets (either in GitHub Actions or locally with secrets)
    if [ "$GITHUB_ACTIONS" = "true" ] || [ -n "$SUPABASE_URL" ] || [ -n "$SUPABASE_ANON_KEY" ]; then
        print_status "GitHub Secrets detected - creating .env files from secrets"
        
        # Create backend .env from secrets
        if [ ! -f "../backend/.env" ]; then
            print_status "Creating backend .env from GitHub Secrets..."
            {
                echo "# Backend Environment Variables"
                echo "# Generated from GitHub Secrets"
                echo "# Update these values with your actual configuration"
                echo ""
                echo "# Server Configuration"
                echo "PORT=3001"
                echo "NODE_ENV=production"
                echo ""
                echo "# Frontend URL (for CORS)"
                echo "FRONTEND_URL=http://localhost:80"
                echo ""
                echo "# Supabase Configuration"
                echo "SUPABASE_URL=${SUPABASE_URL:-https://your-project.supabase.co}"
                echo "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-your_supabase_anon_key_here}"
                echo "SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-your_supabase_service_role_key_here}"
                echo ""
                echo "# JWT Configuration"
                echo "JWT_SECRET=${JWT_SECRET:-}"
                echo "JWT_EXPIRES_IN=7d"
                echo ""
                echo "# Session Configuration"
                echo "SESSION_SECRET=${SESSION_SECRET:-}"
                echo ""
                echo "# Connect to Supabase via connection pooling"
                echo "DATABASE_URL=${DATABASE_URL:-}"
                echo ""
                echo "# Direct connection to the database. Used for migrations"
                echo "DIRECT_URL=${DIRECT_URL:-}"
            } > ../backend/.env
            print_success "Backend .env file created from GitHub Secrets!"
        fi
        
        # Create frontend .env from secrets
        if [ ! -f "../frontend/.env" ]; then
            print_status "Creating frontend .env from GitHub Secrets..."
            {
                echo "# Frontend Environment Variables"
                echo "# Generated from GitHub Secrets"
                echo "# Update these values with your actual configuration"
                echo ""
                echo "VITE_SUPABASE_URL=${SUPABASE_URL:-https://your-project.supabase.co}"
                echo "VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-your_supabase_anon_key_here}"
                echo ""
                echo "# Mapbox Configuration"
                echo "VITE_MAPBOX_TOKEN=${MAPBOX_TOKEN:-your_mapbox_token_here}"
            } > ../frontend/.env
            print_success "Frontend .env file created from GitHub Secrets!"
        fi
        
        print_success "Environment files created from GitHub Secrets!"
        return
    fi
    
    # Fallback to templates if no secrets available
    print_status "No GitHub Secrets detected - falling back to templates"
    
    # Check for backend .env file
    if [ ! -f "../backend/.env" ]; then
        print_warning ".env file not found in the backend directory."
        print_status "Creating backend .env file from template..."
        
        if [ -f "env_backend.template" ]; then
            {
                echo "# Backend Environment Variables"
                echo "# Generated from CICD/env_backend.template"
                echo "# Update these values with your actual configuration"
                cat env_backend.template
            } > ../backend/.env
            print_success "Backend .env file created successfully from template!"
        else
            print_warning "env_backend.template not found, creating default backend configuration"
            {
                echo "# Backend Environment Variables"
                echo "# Default configuration - please update with your actual values"
                echo "PORT=3001"
                echo 'NODE_ENV="production"'
                echo 'FRONTEND_URL="http://localhost:80"'
                echo 'SUPABASE_URL="https://your-project.supabase.co"'
                echo 'SUPABASE_ANON_KEY="your_supabase_anon_key_here"'
                echo 'SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key_here"'
                echo 'JWT_SECRET=""'
                echo 'JWT_EXPIRES_IN=""'
                echo 'SESSION_SECRET=""'
                echo 'DATABASE_URL=""'
                echo 'DIRECT_URL=""'
            } > ../backend/.env
            print_success "Backend .env file created with default configuration!"
        fi
        print_warning "Please update the backend .env file with your actual configuration values."
        exit 1
    fi
    
    # Check for frontend .env file
    if [ ! -f "../frontend/.env" ]; then
        print_warning ".env file not found in the frontend directory."
        print_status "Creating frontend .env file from template..."
        
        if [ -f "env_frontend.template" ]; then
            {
                echo "# Frontend Environment Variables"
                echo "# Generated from CICD/env_frontend.template"
                echo "# Update these values with your actual configuration"
                cat env_frontend.template
            } > ../frontend/.env
            print_success "Frontend .env file created successfully from template!"
        else
            print_warning "env_frontend.template not found, creating default frontend configuration"
            {
                echo "# Frontend Environment Variables"
                echo "# Default configuration - please update with your actual values"
                echo 'VITE_SUPABASE_URL="https://your-project.supabase.co"'
                echo 'VITE_SUPABASE_ANON_KEY="your_supabase_anon_key_here"'
                echo 'VITE_MAPBOX_TOKEN="your_mapbox_token_here"'
                echo 'VITE_API_URL="http://localhost:3001"'
            } > ../frontend/.env
            print_success "Frontend .env file created with default configuration!"
        fi
        print_warning "Please update the frontend .env file with your actual configuration values."
        exit 1
    fi
}

# Function to build images
build_images() {
    print_status "Building Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -f Dockerfile.backend -t driven-devs-backend ..
    
    # Build frontend image
    print_status "Building frontend image..."
    docker build -f Dockerfile.frontend -t driven-devs-frontend ..
    
    print_success "Docker images built successfully!"
}

# Function to run containers
run_containers() {
    print_status "Starting containers with docker-compose..."
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Start containers
    docker-compose up -d
    
    print_success "Containers started successfully!"
}

# Function to show status
show_status() {
    print_status "Container status:"
    docker-compose ps
    
    echo ""
    print_status "Application URLs:"
    echo -e "  Frontend: ${GREEN}http://localhost:80${NC}"
    echo -e "  Backend API: ${GREEN}http://localhost:3001${NC}"
    
    echo ""
    print_status "Useful commands:"
    echo -e "  View logs: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "  Stop containers: ${YELLOW}docker-compose down${NC}"
    echo -e "  Restart containers: ${YELLOW}docker-compose restart${NC}"
}

# Function to show logs
show_logs() {
    print_status "Showing container logs (Ctrl+C to exit)..."
    docker-compose logs -f
}

# Function to stop containers
stop_containers() {
    print_status "Stopping containers..."
    docker-compose down
    print_success "Containers stopped successfully!"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up Docker resources..."
    
    # Stop and remove containers
    docker-compose down -v 2>/dev/null || true
    
    # Remove images
    docker rmi driven-devs-backend driven-devs-frontend 2>/dev/null || true
    
    # Remove unused volumes
    docker volume prune -f 2>/dev/null || true
    
    print_success "Cleanup completed!"
}

# Main script logic
case "${1:-build}" in
    "build")
        check_env_files
        build_images
        run_containers
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "stop")
        stop_containers
        ;;
    "restart")
        stop_containers
        run_containers
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    "status")
        show_status
        ;;
    *)
        echo "Usage: $0 {build|logs|stop|restart|cleanup|status}"
        echo ""
        echo "Commands:"
        echo "  build    - Build and start containers (default)"
        echo "  logs     - Show container logs"
        echo "  stop     - Stop containers"
        echo "  restart  - Restart containers"
        echo "  cleanup  - Stop containers and remove images/volumes"
        echo "  status   - Show container status and URLs"
        exit 1
        ;;
esac 