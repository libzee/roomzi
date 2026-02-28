#!/bin/bash

# Driven Devs Application Deployment Script
# This script deploys the application using Docker Compose

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Configuration
APP_NAME="Driven Devs"
BACKEND_IMAGE="thushshan/roomzi-backend:1.0.0"
FRONTEND_IMAGE="thushshan/roomzi-frontend:1.0.0"
COMPOSE_FILE="docker-compose.yml"

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not available. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if curl is available for health checks
    if ! command -v curl &> /dev/null; then
        warning "curl is not available. Health checks will be limited."
    fi
    
    success "Prerequisites check passed"
}

# Function to validate environment files
validate_environment() {
    log "Validating environment configuration..."
    
    # Always try to create .env files from GitHub Secrets first (if available)
    log "Attempting to create .env files from GitHub Secrets..."
    
    # Check if we have access to GitHub Secrets (either in GitHub Actions or locally with secrets)
    if [ "$GITHUB_ACTIONS" = "true" ] || [ -n "$SUPABASE_URL" ] || [ -n "$SUPABASE_ANON_KEY" ]; then
        log "GitHub Secrets detected - creating .env files from secrets"
        
        # Always create backend .env from secrets (overwrite if exists)
        log "Creating backend .env from GitHub Secrets..."
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
            echo ""
            echo "# OpenAI Configuration (for AI features)"
            echo "OPENAI_API_KEY=${OPENAI_API_KEY:-}"
            echo ""
            echo "# File Upload Configuration"
            echo "MAX_FILE_SIZE=10mb"
            echo "UPLOAD_PATH=./uploads"
        } > ../backend/.env
        success "Backend .env file created from GitHub Secrets!"
        
        # Always create frontend .env from secrets (overwrite if exists)
        log "Creating frontend .env from GitHub Secrets..."
        {
            echo "# Frontend Environment Variables"
            echo "# Generated from GitHub Secrets"
            echo "# Update these values with your actual configuration"
            echo ""
            echo "VITE_SUPABASE_URL=${SUPABASE_URL:-https://your-project.supabase.co}"
            echo "VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-your_supabase_anon_key_here}"
            echo ""
            echo "# API Configuration"
            echo "VITE_API_URL=http://localhost:3001"
            echo ""
            echo "# Mapbox Configuration"
            echo "VITE_MAPBOX_TOKEN=${MAPBOX_TOKEN:-your_mapbox_token_here}"
            echo ""
            echo "# Application Configuration"
            echo "VITE_APP_NAME=Roomzi Home Finder"
            echo "VITE_APP_VERSION=1.0.0"
        } > ../frontend/.env
        success "Frontend .env file created from GitHub Secrets!"
        
        success "Environment files created from GitHub Secrets!"
        return
    fi
    
    # Fallback to templates if no secrets available
    log "No GitHub Secrets detected - falling back to templates"
    
    # Check for backend .env file
    if [ ! -f "../backend/.env" ]; then
        warning "Backend .env file not found. Creating from template..."
        cp env_backend.template ../backend/.env
        warning "Please update ../backend/.env with your actual configuration values"
    fi
    
    # Check for frontend .env file
    if [ ! -f "../frontend/.env" ]; then
        warning "Frontend .env file not found. Creating from template..."
        cp env_frontend.template ../frontend/.env
        warning "Please update ../frontend/.env with your actual configuration values"
    fi
    
    success "Environment validation completed"
}

# Function to pull Docker images
pull_images() {
    log "Pulling Docker images..."
    
    # Pull backend image
    log "Pulling backend image: $BACKEND_IMAGE"
    if docker pull $BACKEND_IMAGE; then
        success "Backend image pulled successfully"
    else
        error "Failed to pull backend image"
        exit 1
    fi
    
    # Pull frontend image
    log "Pulling frontend image: $FRONTEND_IMAGE"
    if docker pull $FRONTEND_IMAGE; then
        success "Frontend image pulled successfully"
    else
        error "Failed to pull frontend image"
        exit 1
    fi
}

# Function to stop existing containers
stop_existing_containers() {
    log "Stopping existing containers..."
    
    if docker-compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null; then
        success "Existing containers stopped"
    else
        warning "No existing containers to stop or error occurred"
    fi
}

# Function to deploy containers
deploy_containers() {
    log "Deploying containers..."
    
    # Deploy using docker-compose
    if docker-compose -f $COMPOSE_FILE up -d; then
        success "Containers deployed successfully"
    else
        error "Failed to deploy containers"
        exit 1
    fi
}

# Function to wait for services to be ready
wait_for_services() {
    log "Waiting for services to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Checking service readiness (attempt $attempt/$max_attempts)..."
        
        # Check if containers are running
        if docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
            success "All containers are running"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error "Services failed to start within the expected time"
            docker-compose -f $COMPOSE_FILE logs
            exit 1
        fi
        
        sleep 10
        attempt=$((attempt + 1))
    done
}

# Function to perform comprehensive health checks
perform_health_checks() {
    log "Performing comprehensive health checks..."
    
    # Test backend health endpoint
    log "Testing backend health endpoint..."
    if curl -f "${BACKEND_URL}/api/health" > /dev/null 2>&1; then
        success "Backend health endpoint is responding"
    else
        error "Backend health endpoint is not responding"
        return 1
    fi
    
    # Test frontend accessibility
    log "Testing frontend accessibility..."
    if curl -f "${FRONTEND_URL}" > /dev/null 2>&1; then
        success "Frontend is accessible"
    else
        error "Frontend is not accessible"
        return 1
    fi
    
    # Test API endpoints
    log "Testing API endpoints..."
    if curl -f "${BACKEND_URL}/api/landlords" > /dev/null 2>&1; then
        success "API endpoints are accessible"
    else
        warning "API endpoints may not be accessible"
    fi
    
    # Test container health status
    log "Testing container health status..."
    BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' driven-devs-backend 2>/dev/null || echo "unknown")
    FRONTEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' driven-devs-frontend 2>/dev/null || echo "unknown")
    
    if [ "$BACKEND_HEALTH" = "healthy" ]; then
        success "Backend container is healthy"
    else
        warning "Backend container health status: ${BACKEND_HEALTH}"
    fi
    
    if [ "$FRONTEND_HEALTH" = "healthy" ]; then
        success "Frontend container is healthy"
    else
        warning "Frontend container health status: ${FRONTEND_HEALTH}"
    fi
    
    # Test container configuration
    log "Testing container configuration..."
    
    # Test restart policies
    BACKEND_RESTART_POLICY=$(docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-backend 2>/dev/null || echo "unknown")
    FRONTEND_RESTART_POLICY=$(docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-frontend 2>/dev/null || echo "unknown")
    
    if [ "$BACKEND_RESTART_POLICY" != "unknown" ]; then
        success "Backend restart policy: ${BACKEND_RESTART_POLICY}"
    else
        warning "Could not check backend restart policy"
    fi
    
    if [ "$FRONTEND_RESTART_POLICY" != "unknown" ]; then
        success "Frontend restart policy: ${FRONTEND_RESTART_POLICY}"
    else
        warning "Could not check frontend restart policy"
    fi
    
    # Test port bindings
    log "Testing port bindings..."
    if docker port driven-devs-backend >/dev/null 2>&1; then
        success "Backend port bindings verified"
    else
        warning "Could not verify backend port bindings"
    fi
    
    if docker port driven-devs-frontend >/dev/null 2>&1; then
        success "Frontend port bindings verified"
    else
        warning "Could not verify frontend port bindings"
    fi
    
    # Test network connectivity between containers
    log "Testing inter-container communication..."
    if docker exec driven-devs-frontend ping -c 1 driven-devs-backend >/dev/null 2>&1; then
        success "Containers can communicate internally"
    else
        warning "Inter-container communication test failed"
    fi
    
    # Test resource usage
    log "Testing resource usage..."
    BACKEND_MEMORY=$(docker stats --no-stream --format "{{.MemUsage}}" driven-devs-backend 2>/dev/null || echo "N/A")
    FRONTEND_MEMORY=$(docker stats --no-stream --format "{{.MemUsage}}" driven-devs-frontend 2>/dev/null || echo "N/A")
    BACKEND_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" driven-devs-backend 2>/dev/null || echo "N/A")
    FRONTEND_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" driven-devs-frontend 2>/dev/null || echo "N/A")
    
    success "Backend Memory: ${BACKEND_MEMORY}, CPU: ${BACKEND_CPU}"
    success "Frontend Memory: ${FRONTEND_MEMORY}, CPU: ${FRONTEND_CPU}"
    
    success "All health checks completed successfully!"
}

# Function to display deployment information
display_deployment_info() {
    log "Deployment completed successfully!"
    echo
    echo "=========================================="
    echo "           $APP_NAME Deployment"
    echo "=========================================="
    echo
    echo "Application URLs:"
    echo "  Frontend: http://localhost:80"
    echo "  Backend API: http://localhost:3001"
    echo "  Health Check: http://localhost:3001/api/health"
    echo
    echo "Container Status:"
    docker-compose -f $COMPOSE_FILE ps
    echo
    echo "Useful Commands:"
    echo "  View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  Stop services: docker-compose -f $COMPOSE_FILE down"
    echo "  Restart services: docker-compose -f $COMPOSE_FILE restart"
    echo
    echo "=========================================="
}

# Function to handle cleanup on script exit
cleanup() {
    if [ $? -ne 0 ]; then
        error "Deployment failed. Cleaning up..."
        docker-compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true
    fi
}

# Set up trap for cleanup
trap cleanup EXIT

# Main deployment process
main() {
    echo "=========================================="
    echo "    $APP_NAME Deployment Script"
    echo "=========================================="
    echo
    
    check_prerequisites
    validate_environment
    pull_images
    stop_existing_containers
    deploy_containers
    wait_for_services
    perform_health_checks
    display_deployment_info
    
    success "Deployment completed successfully!"
}

# Run main function
main "$@" 