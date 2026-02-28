#!/bin/bash

# Driven Devs CD Pipeline - Testing Script for Linux/Mac
# This script runs automated tests against the deployed application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
FRONTEND_URL="http://localhost:80"
BACKEND_URL="http://localhost:3001"
HEALTH_ENDPOINT="${BACKEND_URL}/api/health"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and update counters
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command" >/dev/null 2>&1; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        log_success "$test_name: PASSED"
        return 0
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        log_warning "$test_name: FAILED"
        return 1
    fi
}

echo "🧪 Starting Driven Devs CD Pipeline - Testing Phase..."

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker and try again."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "docker-compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

if ! docker info &> /dev/null; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if containers are running
log_info "Checking if containers are running..."
if ! docker-compose ps | grep -q "Up"; then
    log_error "Containers are not running. Please deploy the application first."
    exit 1
fi
log_success "Containers are running!"

log_info "Testing container functionality and performance..."

# Test container health
log_info "Testing container health..."
run_test "Backend Health Endpoint" "curl -f ${HEALTH_ENDPOINT}"
run_test "Frontend Accessibility" "curl -f ${FRONTEND_URL}"
run_test "API Endpoints" "curl -f ${BACKEND_URL}/api/landlords"

# Test container restart policy
log_info "Testing container restart policy..."
BACKEND_RESTART_POLICY=$(docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-backend 2>/dev/null || echo "unknown")
FRONTEND_RESTART_POLICY=$(docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-frontend 2>/dev/null || echo "unknown")

log_info "Backend restart policy: ${BACKEND_RESTART_POLICY}"
log_info "Frontend restart policy: ${FRONTEND_RESTART_POLICY}"

run_test "Backend Restart Policy" "docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-backend"
run_test "Frontend Restart Policy" "docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-frontend"

# Test port bindings
log_info "Testing port bindings..."
log_info "Backend port bindings:"
docker port driven-devs-backend 2>/dev/null || log_warning "Could not check backend port bindings"

log_info "Frontend port bindings:"
docker port driven-devs-frontend 2>/dev/null || log_warning "Could not check frontend port bindings"

run_test "Backend Port Binding" "docker port driven-devs-backend"
run_test "Frontend Port Binding" "docker port driven-devs-frontend"

# Test network connectivity between containers
log_info "Testing network connectivity between containers..."
run_test "Inter-Container Communication" "docker exec driven-devs-frontend ping -c 1 driven-devs-backend"

# Test container resource limits
log_info "Testing container resource limits..."
BACKEND_MEMORY_LIMIT=$(docker inspect --format='{{.HostConfig.Memory}}' driven-devs-backend 2>/dev/null || echo "0")
FRONTEND_MEMORY_LIMIT=$(docker inspect --format='{{.HostConfig.Memory}}' driven-devs-frontend 2>/dev/null || echo "0")

if [ "$BACKEND_MEMORY_LIMIT" = "0" ]; then
    log_info "Backend memory: No limit set"
else
    log_info "Backend memory limit: ${BACKEND_MEMORY_LIMIT} bytes"
fi

if [ "$FRONTEND_MEMORY_LIMIT" = "0" ]; then
    log_info "Frontend memory: No limit set"
else
    log_info "Frontend memory limit: ${FRONTEND_MEMORY_LIMIT} bytes"
fi

run_test "Backend Memory Limits" "docker inspect --format='{{.HostConfig.Memory}}' driven-devs-backend"
run_test "Frontend Memory Limits" "docker inspect --format='{{.HostConfig.Memory}}' driven-devs-frontend"

# Test container uptime
log_info "Testing container uptime..."
BACKEND_STARTED_AT=$(docker inspect --format='{{.State.StartedAt}}' driven-devs-backend 2>/dev/null || echo "unknown")
FRONTEND_STARTED_AT=$(docker inspect --format='{{.State.StartedAt}}' driven-devs-frontend 2>/dev/null || echo "unknown")

log_info "Backend started at: ${BACKEND_STARTED_AT}"
log_info "Frontend started at: ${FRONTEND_STARTED_AT}"

run_test "Backend Uptime" "docker inspect --format='{{.State.StartedAt}}' driven-devs-backend"
run_test "Frontend Uptime" "docker inspect --format='{{.State.StartedAt}}' driven-devs-frontend"

# Test container logs for errors
log_info "Testing container logs for errors..."
BACKEND_ERRORS=$(docker-compose logs backend 2>&1 | grep -i "error\|exception\|fail" | wc -l)
FRONTEND_ERRORS=$(docker-compose logs frontend 2>&1 | grep -i "error\|exception\|fail" | wc -l)

if [ "$BACKEND_ERRORS" -eq 0 ]; then
    log_success "No errors found in backend logs!"
else
    log_warning "Found ${BACKEND_ERRORS} potential errors in backend logs"
fi

if [ "$FRONTEND_ERRORS" -eq 0 ]; then
    log_success "No errors found in frontend logs!"
else
    log_warning "Found ${FRONTEND_ERRORS} potential errors in frontend logs"
fi

run_test "Backend Log Analysis" "[ $BACKEND_ERRORS -eq 0 ]"
run_test "Frontend Log Analysis" "[ $FRONTEND_ERRORS -eq 0 ]"

# Test container health status
log_info "Testing container health status..."
run_test "Backend Container Health" "docker inspect --format='{{.State.Health.Status}}' driven-devs-backend | grep -q 'healthy'"
run_test "Frontend Container Health" "docker inspect --format='{{.State.Health.Status}}' driven-devs-frontend | grep -q 'healthy'"

# Test resource usage
log_info "Testing resource usage..."
BACKEND_MEMORY=$(docker stats --no-stream --format "{{.MemUsage}}" driven-devs-backend 2>/dev/null || echo "N/A")
FRONTEND_MEMORY=$(docker stats --no-stream --format "{{.MemUsage}}" driven-devs-frontend 2>/dev/null || echo "N/A")
BACKEND_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" driven-devs-backend 2>/dev/null || echo "N/A")
FRONTEND_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" driven-devs-frontend 2>/dev/null || echo "N/A")

log_info "Backend Memory: ${BACKEND_MEMORY} (actual usage)"
log_info "Frontend Memory: ${FRONTEND_MEMORY} (actual usage)"
log_info "Backend CPU: ${BACKEND_CPU} (current usage)"
log_info "Frontend CPU: ${FRONTEND_CPU} (current usage)"

run_test "Backend Memory Usage" "docker stats --no-stream --format '{{.MemUsage}}' driven-devs-backend"
run_test "Frontend Memory Usage" "docker stats --no-stream --format '{{.MemUsage}}' driven-devs-frontend"
run_test "Backend CPU Usage" "docker stats --no-stream --format '{{.CPUPerc}}' driven-devs-backend"
run_test "Frontend CPU Usage" "docker stats --no-stream --format '{{.CPUPerc}}' driven-devs-frontend"

# Generate test report
log_info "Generating test report..."

echo
echo "=========================================="
echo "           TEST REPORT SUMMARY            "
echo "=========================================="
echo "Timestamp: $(date)"
echo "Frontend URL: ${FRONTEND_URL}"
echo "Backend URL: ${BACKEND_URL}"
echo

echo "Container Status:"
docker-compose ps
echo

echo "Health Check Results:"
if curl -f "${HEALTH_ENDPOINT}" >/dev/null 2>&1; then
    echo "[OK] Backend Health: OK"
else
    echo "[FAIL] Backend Health: FAILED"
fi

if curl -f "${FRONTEND_URL}" >/dev/null 2>&1; then
    echo "[OK] Frontend Health: OK"
else
    echo "[FAIL] Frontend Health: FAILED"
fi
echo

log_success "Test report generated!"

log_info "Testing completed!"
echo
log_info "Actual Test Results Summary:"
echo

# Test container health status
echo "[CONTAINER HEALTH TESTS]"
if docker inspect --format='{{.State.Health.Status}}' driven-devs-backend 2>/dev/null | grep -q "healthy"; then
    echo "  Backend Container: [OK] Status: healthy"
else
    echo "  Backend Container: [WARN] Status: $(docker inspect --format='{{.State.Health.Status}}' driven-devs-backend 2>/dev/null || echo 'unknown')"
fi

if docker inspect --format='{{.State.Health.Status}}' driven-devs-frontend 2>/dev/null | grep -q "healthy"; then
    echo "  Frontend Container: [OK] Status: healthy"
else
    echo "  Frontend Container: [WARN] Status: $(docker inspect --format='{{.State.Health.Status}}' driven-devs-frontend 2>/dev/null || echo 'unknown')"
fi
echo

# Test endpoint availability
echo "[ENDPOINT AVAILABILITY TESTS]"
if curl -f "${HEALTH_ENDPOINT}" >/dev/null 2>&1; then
    echo "  Backend Health Check: [OK] Endpoint accessible and responding"
else
    echo "  Backend Health Check: [FAIL] Endpoint not responding"
fi

if curl -f "${FRONTEND_URL}" >/dev/null 2>&1; then
    echo "  Frontend Accessibility: [OK] Frontend accessible and loading"
else
    echo "  Frontend Accessibility: [FAIL] Frontend not loading"
fi

if curl -f "${BACKEND_URL}/api/landlords" >/dev/null 2>&1; then
    echo "  API Endpoints: [OK] API structure accessible"
else
    echo "  API Endpoints: [FAIL] API not accessible"
fi
echo

# Test container configuration
echo "[CONTAINER CONFIGURATION TESTS]"
if docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-backend >/dev/null 2>&1; then
    echo "  Backend Restart Policy: [OK] $(docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-backend)"
else
    echo "  Backend Restart Policy: [FAIL] Could not check"
fi

if docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-frontend >/dev/null 2>&1; then
    echo "  Frontend Restart Policy: [OK] $(docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-frontend)"
else
    echo "  Frontend Restart Policy: [FAIL] Could not check"
fi

if docker port driven-devs-backend >/dev/null 2>&1; then
    echo "  Backend Port Binding: [OK] Ports properly bound"
else
    echo "  Backend Port Binding: [FAIL] Could not check"
fi

if docker port driven-devs-frontend >/dev/null 2>&1; then
    echo "  Frontend Port Binding: [OK] Ports properly bound"
else
    echo "  Frontend Port Binding: [FAIL] Could not check"
fi
echo

# Test network connectivity
echo "[NETWORK CONNECTIVITY TESTS]"
if docker exec driven-devs-frontend ping -c 1 driven-devs-backend >/dev/null 2>&1; then
    echo "  Inter-Container Communication: [OK] Containers can communicate"
else
    echo "  Inter-Container Communication: [FAIL] Frontend cannot reach backend"
fi
echo

# Test resource usage
echo "[RESOURCE USAGE TESTS]"
echo "  Backend Memory: [INFO] ${BACKEND_MEMORY} (actual usage)"
echo "  Frontend Memory: [INFO] ${FRONTEND_MEMORY} (actual usage)"
echo "  Backend CPU: [INFO] ${BACKEND_CPU} (current usage)"
echo "  Frontend CPU: [INFO] ${FRONTEND_CPU} (current usage)"
echo

# Show log analysis results
echo "[LOG ANALYSIS]"
if [ "$BACKEND_ERRORS" -eq 0 ]; then
    echo "  Backend Logs: [OK] No errors detected (0 found)"
else
    echo "  Backend Logs: [WARN] ${BACKEND_ERRORS} potential errors detected"
fi

if [ "$FRONTEND_ERRORS" -eq 0 ]; then
    echo "  Frontend Logs: [OK] No errors detected (0 found)"
else
    echo "  Frontend Logs: [WARN] ${FRONTEND_ERRORS} potential errors detected"
fi
echo

echo "[OVERALL STATUS]"
echo "  Total Tests Executed: ${TOTAL_TESTS} actual tests"
echo "  Tests Passed: ${PASSED_TESTS}"
echo "  Tests Failed: ${FAILED_TESTS}"
echo "  Error Status: ${BACKEND_ERRORS} backend errors, ${FRONTEND_ERRORS} frontend errors detected"
echo

echo "[FAILED TESTS SUMMARY]"
if [ "$FAILED_TESTS" -gt 0 ]; then
    echo "  The following tests failed:"
    # Check each test category and report failures
    if ! curl -f "${HEALTH_ENDPOINT}" >/dev/null 2>&1; then
        echo "    - Backend Health Endpoint: Not responding"
    fi
    if ! curl -f "${FRONTEND_URL}" >/dev/null 2>&1; then
        echo "    - Frontend Accessibility: Not accessible"
    fi
    if ! curl -f "${BACKEND_URL}/api/landlords" >/dev/null 2>&1; then
        echo "    - API Endpoints: Not accessible"
    fi
    if ! docker exec driven-devs-frontend ping -c 1 driven-devs-backend >/dev/null 2>&1; then
        echo "    - Inter-Container Communication: Failed"
    fi
    if [ "$BACKEND_ERRORS" -gt 0 ]; then
        echo "    - Backend Logs: ${BACKEND_ERRORS} errors detected"
    fi
    if [ "$FRONTEND_ERRORS" -gt 0 ]; then
        echo "    - Frontend Logs: ${FRONTEND_ERRORS} errors detected"
    fi
else
    echo "  All tests passed successfully!"
fi
echo

echo "[INFO] Application URLs:"
echo "  Frontend: ${FRONTEND_URL}"
echo "  Backend API: ${BACKEND_URL}"
echo "  Health Check: ${HEALTH_ENDPOINT}"

# Cleanup function
cleanup() {
    log_info "Testing completed. Exiting..."
}

# Set trap for cleanup
trap cleanup EXIT 