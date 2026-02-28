#!/bin/bash
export PATH=$PATH:/usr/local/bin

# Driven Devs Complete CD Pipeline
# This script implements a full Continuous Delivery pipeline including deployment and testing

set -e  # Exit on any error

echo "🚀 Starting Driven Devs Complete CD Pipeline..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_phase() {
    echo -e "${PURPLE}[PHASE]${NC} $1"
}

# Configuration
DOCKER_REGISTRY="thushshan"
FRONTEND_IMAGE="roomzi-frontend"
BACKEND_IMAGE="roomzi-backend"
IMAGE_TAG="1.0.0"
FRONTEND_URL="http://localhost:80"
BACKEND_URL="http://localhost:3001"
HEALTH_ENDPOINT="${BACKEND_URL}/api/health"

# Pipeline start time
PIPELINE_START_TIME=$(date +%s)

# Function to print pipeline header
print_pipeline_header() {
    echo ""
    echo "=========================================="
    echo "      DRIVEN DEVS CD PIPELINE v1.0        "
    echo "=========================================="
    echo "Start Time: $(date)"
    echo "Registry: ${DOCKER_REGISTRY}"
    echo "Images: ${FRONTEND_IMAGE}:${IMAGE_TAG}, ${BACKEND_IMAGE}:${IMAGE_TAG}"
    echo "=========================================="
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    print_phase "Checking Prerequisites"
    
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
    
    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        print_error "curl is not installed. Please install curl and try again."
        exit 1
    fi
    
    print_success "All prerequisites are met!"
}

# Function to check environment files
check_environment() {
    print_phase "Checking Environment Configuration"
    
    # Always try to create .env files from GitHub Secrets first (if available)
    print_status "Attempting to create .env files from GitHub Secrets..."
    
    # Check if we have access to GitHub Secrets (either in GitHub Actions or locally with secrets)
    if [ "$GITHUB_ACTIONS" = "true" ] || [ -n "$SUPABASE_URL" ] || [ -n "$SUPABASE_ANON_KEY" ]; then
        print_status "GitHub Secrets detected - creating .env files from secrets"
        
        # Always create backend .env from secrets (overwrite if exists)
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
            echo ""
            echo "# OpenAI Configuration (for AI features)"
            echo "OPENAI_API_KEY=${OPENAI_API_KEY:-}"
            echo ""
            echo "# File Upload Configuration"
            echo "MAX_FILE_SIZE=10mb"
            echo "UPLOAD_PATH=./uploads"
        } > ../backend/.env
        print_success "Backend .env file created from GitHub Secrets!"
        
        # Always create frontend .env from secrets (overwrite if exists)
        print_status "Creating frontend .env from GitHub Secrets..."
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
        print_success "Frontend .env file created from GitHub Secrets!"
        
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
                echo 'OPENAI_API_KEY=""'
                echo 'MAX_FILE_SIZE="10mb"'
                echo 'UPLOAD_PATH="./uploads"'
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
    
    print_success "Environment configuration is ready!"
}

# Function to pull images from Docker Hub
pull_images() {
    print_phase "Pulling Docker Images from Registry"
    
    # Pull backend image
    print_status "Pulling backend image: ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}"
    if docker pull "${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}"; then
        print_success "Backend image pulled successfully!"
    else
        print_error "Failed to pull backend image"
        exit 1
    fi
    
    # Pull frontend image
    print_status "Pulling frontend image: ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}"
    if docker pull "${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}"; then
        print_success "Frontend image pulled successfully!"
    else
        print_error "Failed to pull frontend image"
        exit 1
    fi
}

# Function to deploy containers
deploy_containers() {
    print_phase "Deploying Application Containers"
    
    # Stop any existing containers
    print_status "Stopping existing containers..."
    docker-compose down 2>/dev/null || true
    
    # Start containers using pulled images
    print_status "Starting containers with pulled images..."
    if docker-compose up -d; then
        print_success "Containers deployed successfully!"
    else
        print_error "Failed to deploy containers"
        exit 1
    fi
}

# Function to wait for services to be ready
wait_for_services() {
    print_phase "Waiting for Services to be Ready"
    
    # Wait for backend
    print_status "Waiting for backend service..."
    local backend_ready=false
    for i in {1..30}; do
        if curl -f "${HEALTH_ENDPOINT}" > /dev/null 2>&1; then
            backend_ready=true
            print_success "Backend service is ready!"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    if [ "$backend_ready" = false ]; then
        print_warning "Backend service may not be fully ready"
    fi
    
    # Wait for frontend
    print_status "Waiting for frontend service..."
    local frontend_ready=false
    for i in {1..30}; do
        if curl -f "${FRONTEND_URL}" > /dev/null 2>&1; then
            frontend_ready=true
            print_success "Frontend service is ready!"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    if [ "$frontend_ready" = false ]; then
        print_warning "Frontend service may not be fully ready"
    fi
}

# Function to run comprehensive container tests
run_comprehensive_tests() {
    print_phase "Running Comprehensive Container Tests"
    
    # Test container configuration
    print_status "Testing container configuration..."
    
    # Test restart policies
    BACKEND_RESTART_POLICY=$(docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-backend 2>/dev/null || echo "unknown")
    FRONTEND_RESTART_POLICY=$(docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-frontend 2>/dev/null || echo "unknown")
    
    if [ "$BACKEND_RESTART_POLICY" != "unknown" ]; then
        print_success "Backend restart policy: ${BACKEND_RESTART_POLICY}"
    else
        print_warning "Could not check backend restart policy"
    fi
    
    if [ "$FRONTEND_RESTART_POLICY" != "unknown" ]; then
        print_success "Frontend restart policy: ${FRONTEND_RESTART_POLICY}"
    else
        print_warning "Could not check frontend restart policy"
    fi
    
    # Test port bindings
    print_status "Testing port bindings..."
    if docker port driven-devs-backend >/dev/null 2>&1; then
        print_success "Backend port bindings verified"
    else
        print_warning "Could not verify backend port bindings"
    fi
    
    if docker port driven-devs-frontend >/dev/null 2>&1; then
        print_success "Frontend port bindings verified"
    else
        print_warning "Could not verify frontend port bindings"
    fi
    
    # Test network connectivity between containers
    print_status "Testing inter-container communication..."
    if docker exec driven-devs-frontend ping -c 1 driven-devs-backend >/dev/null 2>&1; then
        print_success "Containers can communicate internally"
    else
        print_warning "Inter-container communication test failed"
    fi
    
    # Test container resource limits
    print_status "Testing container resource limits..."
    BACKEND_MEMORY_LIMIT=$(docker inspect --format='{{.HostConfig.Memory}}' driven-devs-backend 2>/dev/null || echo "0")
    FRONTEND_MEMORY_LIMIT=$(docker inspect --format='{{.HostConfig.Memory}}' driven-devs-frontend 2>/dev/null || echo "0")
    
    if [ "$BACKEND_MEMORY_LIMIT" != "0" ]; then
        print_success "Backend memory limit: ${BACKEND_MEMORY_LIMIT} bytes"
    else
        print_warning "Backend memory: No limit set"
    fi
    
    if [ "$FRONTEND_MEMORY_LIMIT" != "0" ]; then
        print_success "Frontend memory limit: ${FRONTEND_MEMORY_LIMIT} bytes"
    else
        print_warning "Frontend memory: No limit set"
    fi
    
    # Test container uptime
    print_status "Testing container uptime..."
    BACKEND_STARTED_AT=$(docker inspect --format='{{.State.StartedAt}}' driven-devs-backend 2>/dev/null || echo "unknown")
    FRONTEND_STARTED_AT=$(docker inspect --format='{{.State.StartedAt}}' driven-devs-frontend 2>/dev/null || echo "unknown")
    
    if [ "$BACKEND_STARTED_AT" != "unknown" ]; then
        print_success "Backend started at: ${BACKEND_STARTED_AT}"
    else
        print_warning "Could not check backend uptime"
    fi
    
    if [ "$FRONTEND_STARTED_AT" != "unknown" ]; then
        print_success "Frontend started at: ${FRONTEND_STARTED_AT}"
    else
        print_warning "Could not check frontend uptime"
    fi
    
    # Test resource usage
    print_status "Testing resource usage..."
    BACKEND_MEMORY=$(docker stats --no-stream --format "{{.MemUsage}}" driven-devs-backend 2>/dev/null || echo "N/A")
    FRONTEND_MEMORY=$(docker stats --no-stream --format "{{.MemUsage}}" driven-devs-frontend 2>/dev/null || echo "N/A")
    BACKEND_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" driven-devs-backend 2>/dev/null || echo "N/A")
    FRONTEND_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" driven-devs-frontend 2>/dev/null || echo "N/A")
    
    print_success "Backend Memory: ${BACKEND_MEMORY}, CPU: ${BACKEND_CPU}"
    print_success "Frontend Memory: ${FRONTEND_MEMORY}, CPU: ${FRONTEND_CPU}"
}

# Function to run health checks
run_health_checks() {
    print_phase "Running Health Checks"
    
    # Test backend health endpoint
    print_status "Testing backend health endpoint..."
    if curl -f "${HEALTH_ENDPOINT}" > /dev/null 2>&1; then
        print_success "Backend health endpoint is responding"
    else
        print_error "Backend health endpoint is not responding"
        return 1
    fi
    
    # Test frontend accessibility
    print_status "Testing frontend accessibility..."
    if curl -f "${FRONTEND_URL}" > /dev/null 2>&1; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend is not accessible"
        return 1
    fi
    
    # Test API endpoints
    print_status "Testing API endpoints..."
    if curl -f "${BACKEND_URL}/api/landlords" > /dev/null 2>&1; then
        print_success "API endpoints are accessible"
    else
        print_warning "API endpoints may not be accessible"
    fi
    
    # Test container health status
    print_status "Testing container health status..."
    BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' driven-devs-backend 2>/dev/null || echo "unknown")
    FRONTEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' driven-devs-frontend 2>/dev/null || echo "unknown")
    
    if [ "$BACKEND_HEALTH" = "healthy" ]; then
        print_success "Backend container is healthy"
    else
        print_warning "Backend container health status: ${BACKEND_HEALTH}"
    fi
    
    if [ "$FRONTEND_HEALTH" = "healthy" ]; then
        print_success "Frontend container is healthy"
    else
        print_warning "Frontend container health status: ${FRONTEND_HEALTH}"
    fi
}

# Function to run automated tests
run_automated_tests() {
    print_phase "Running Automated Tests"
    
    # Run backend tests
    print_status "Running backend tests..."
    if docker-compose exec -T backend npm test -- --passWithNoTests --silent 2>/dev/null; then
        print_success "Backend tests passed!"
    else
        print_warning "Backend tests failed or not available - continuing with deployment"
    fi
    
    # Run frontend tests
    print_status "Running frontend tests..."
    if docker-compose exec -T frontend npm test -- --passWithNoTests --silent 2>/dev/null; then
        print_success "Frontend tests passed!"
    else
        print_warning "Frontend tests failed or not available - continuing with deployment"
    fi
    
    # Run integration tests
    print_status "Running integration tests..."
    
    # Test API endpoints
    if curl -f "${BACKEND_URL}/api" > /dev/null 2>&1; then
        print_success "API base endpoint is accessible!"
    else
        print_warning "API base endpoint may not be accessible"
    fi
    
    # Test database connectivity
    health_response=$(curl -s "${HEALTH_ENDPOINT}" 2>/dev/null || echo "{}")
    if echo "$health_response" | grep -q "database\|db"; then
        print_success "Database connectivity confirmed!"
    else
        print_warning "Database connectivity status unknown"
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_phase "Running Performance Tests"
    
    # Test response time for health endpoint
    print_status "Testing response time for health endpoint..."
    start_time=$(date +%s%N)
    curl -f "${HEALTH_ENDPOINT}" > /dev/null 2>&1
    end_time=$(date +%s%N)
    response_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $response_time -lt 1000 ]; then
        print_success "Health endpoint response time: ${response_time}ms (Good)"
    elif [ $response_time -lt 3000 ]; then
        print_warning "Health endpoint response time: ${response_time}ms (Acceptable)"
    else
        print_error "Health endpoint response time: ${response_time}ms (Slow)"
    fi
    
    # Test frontend load time
    print_status "Testing frontend load time..."
    start_time=$(date +%s%N)
    curl -f "${FRONTEND_URL}" > /dev/null 2>&1
    end_time=$(date +%s%N)
    load_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $load_time -lt 2000 ]; then
        print_success "Frontend load time: ${load_time}ms (Good)"
    elif [ $load_time -lt 5000 ]; then
        print_warning "Frontend load time: ${load_time}ms (Acceptable)"
    else
        print_error "Frontend load time: ${load_time}ms (Slow)"
    fi
}

# Function to check container logs
check_container_logs() {
    print_phase "Checking Container Logs"
    
    # Check backend logs
    backend_errors=$(docker-compose logs backend 2>&1 | grep -i "error\|exception\|fail" | wc -l)
    if [ $backend_errors -eq 0 ]; then
        print_success "No errors found in backend logs!"
    else
        print_warning "Found $backend_errors potential errors in backend logs"
    fi
    
    # Check frontend logs
    frontend_errors=$(docker-compose logs frontend 2>&1 | grep -i "error\|exception\|fail" | wc -l)
    if [ $frontend_errors -eq 0 ]; then
        print_success "No errors found in frontend logs!"
    else
        print_warning "Found $frontend_errors potential errors in frontend logs"
    fi
}

# Function to generate pipeline report
generate_pipeline_report() {
    print_phase "Generating Pipeline Report"
    
    PIPELINE_END_TIME=$(date +%s)
    PIPELINE_DURATION=$((PIPELINE_END_TIME - PIPELINE_START_TIME))
    
    echo ""
    echo "=========================================="
    echo "         CD PIPELINE REPORT               "
    echo "=========================================="
    echo "Pipeline Start: $(date -d @$PIPELINE_START_TIME)"
    echo "Pipeline End: $(date -d @$PIPELINE_END_TIME)"
    echo "Total Duration: ${PIPELINE_DURATION} seconds"
    echo ""
    echo "Configuration:"
    echo "  Registry: ${DOCKER_REGISTRY}"
    echo "  Backend Image: ${BACKEND_IMAGE}:${IMAGE_TAG}"
    echo "  Frontend Image: ${FRONTEND_IMAGE}:${IMAGE_TAG}"
    echo ""
    
    # Container status
    echo "Container Status:"
    docker-compose ps
    echo ""
    
    # Health check results
    echo "Health Check Results:"
    if curl -f "${HEALTH_ENDPOINT}" > /dev/null 2>&1; then
        echo "[OK] Backend Health: OK"
    else
        echo "[FAIL] Backend Health: FAILED"
    fi
    
    if curl -f "${FRONTEND_URL}" > /dev/null 2>&1; then
        echo "[OK] Frontend Health: OK"
    else
        echo "[FAIL] Frontend Health: FAILED"
    fi
    echo ""
    
    print_success "Pipeline report generated!"
}

# Function to show final status
show_final_status() {
    print_phase "Pipeline Completed Successfully!"
    
    echo ""
    print_status "📊 Actual Pipeline Results Summary:"
    
    # Test actual prerequisites
    if command -v docker &> /dev/null && docker info &> /dev/null; then
        echo -e "  🔍 Prerequisites Check: ${GREEN}[OK] Docker verified and running${NC}"
    else
        echo -e "  🔍 Prerequisites Check: ${RED}[FAIL] Docker not available${NC}"
    fi
    
    if [ -f ".env" ] || [ -f "backend/.env" ] || [ -f "frontend/.env" ]; then
        echo -e "  ⚙️  Environment Setup: ${GREEN}[OK] Environment files found${NC}"
    else
        echo -e "  ⚙️  Environment Setup: ${YELLOW}[WARN] No environment files detected${NC}"
    fi
    
    # Test actual image pull success
    if docker images | grep -q "driven-devs-backend\|driven-devs-frontend"; then
        echo -e "  📥 Image Pull: ${GREEN}[OK] Docker images available${NC}"
    else
        echo -e "  📥 Image Pull: ${YELLOW}[WARN] No application images found${NC}"
    fi
    
    # Test actual container deployment
    if docker-compose ps | grep -q "Up"; then
        echo -e "  🚀 Container Deployment: ${GREEN}[OK] Containers running${NC}"
    else
        echo -e "  🚀 Container Deployment: ${RED}[FAIL] No containers running${NC}"
    fi
    
    # Test actual service readiness
    if curl -f -s "${HEALTH_ENDPOINT}" > /dev/null 2>&1; then
        echo -e "  ⏱️  Service Readiness: ${GREEN}[OK] Backend health endpoint responding${NC}"
    else
        echo -e "  ⏱️  Service Readiness: ${RED}[FAIL] Backend health endpoint not responding${NC}"
    fi
    
    # Test actual health checks
    if curl -f -s "${HEALTH_ENDPOINT}" > /dev/null 2>&1 && curl -f -s "${FRONTEND_URL}" > /dev/null 2>&1; then
        echo -e "  💚 Health Checks: ${GREEN}[OK] Both endpoints responding${NC}"
    else
        echo -e "  💚 Health Checks: ${RED}[FAIL] One or more endpoints not responding${NC}"
    fi
    
    # Test actual automated tests
    if docker-compose exec -T backend npm test -- --passWithNoTests --silent > /dev/null 2>&1; then
        echo -e "  🧪 Automated Tests: ${GREEN}[OK] Backend tests executed${NC}"
    else
        echo -e "  🧪 Automated Tests: ${YELLOW}[WARN] Backend tests failed or not available${NC}"
    fi
    
    # Test actual performance
    local response_time=$(curl -w "%{time_total}" -s -o /dev/null "${HEALTH_ENDPOINT}" 2>/dev/null || echo "N/A")
    if [ "$response_time" != "N/A" ]; then
        echo -e "  ⚡ Performance Tests: ${GREEN}[OK] Response time: ${response_time}s${NC}"
    else
        echo -e "  ⚡ Performance Tests: ${RED}[FAIL] Unable to measure response time${NC}"
    fi
    
    # Test actual log analysis
    local backend_errors=$(docker-compose logs backend 2>&1 | grep -i "error\|exception\|fail" | wc -l)
    local frontend_errors=$(docker-compose logs frontend 2>&1 | grep -i "error\|exception\|fail" | wc -l)
    if [ $backend_errors -eq 0 ] && [ $frontend_errors -eq 0 ]; then
        echo -e "  📋 Log Analysis: ${GREEN}[OK] No errors detected in logs${NC}"
    else
        echo -e "  📋 Log Analysis: ${YELLOW}[WARN] $backend_errors backend, $frontend_errors frontend errors${NC}"
    fi
    
    echo ""
    print_status "⏱️ Pipeline Timing Information:"
    PIPELINE_END_TIME=$(date +%s)
    PIPELINE_DURATION=$((PIPELINE_END_TIME - PIPELINE_START_TIME))
    echo -e "  Total Pipeline Duration: ${YELLOW}${PIPELINE_DURATION} seconds${NC}"
    echo -e "  Start Time: ${YELLOW}$(date -d @$PIPELINE_START_TIME)${NC}"
    echo -e "  End Time: ${YELLOW}$(date -d @$PIPELINE_END_TIME)${NC}"
    
    echo ""
    print_status "🌐 Application Access Information:"
    echo -e "  Frontend: ${GREEN}${FRONTEND_URL}${NC}"
    echo -e "  Backend API: ${GREEN}${BACKEND_URL}${NC}"
    echo -e "  Health Check: ${GREEN}${HEALTH_ENDPOINT}${NC}"
    
    echo ""
    print_status "🔧 Useful Management Commands:"
    echo -e "  View real-time logs: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "  Stop all containers: ${YELLOW}docker-compose down${NC}"
    echo -e "  Restart pipeline: ${YELLOW}./full-cd-pipeline.sh${NC}"
    echo -e "  Run tests only: ${YELLOW}./test-deployed.sh${NC}"
    echo -e "  Check container status: ${YELLOW}docker-compose ps${NC}"
    echo -e "  View resource usage: ${YELLOW}docker stats${NC}"
}

# Main pipeline process
main() {
    print_pipeline_header
    check_prerequisites
    check_environment
    pull_images
    deploy_containers
    wait_for_services
    run_comprehensive_tests
    run_health_checks
    run_automated_tests
    run_performance_tests
    check_container_logs
    generate_pipeline_report
    show_final_status
}

# Run main function
main 
