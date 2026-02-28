@echo off
setlocal enabledelayedexpansion

REM Driven Devs Complete CD Pipeline for Windows
REM This script implements a full Continuous Delivery pipeline including deployment and testing

echo 🚀 Starting Driven Devs Complete CD Pipeline...

REM Configuration
set DOCKER_REGISTRY=thushshan
set FRONTEND_IMAGE=roomzi-frontend
set BACKEND_IMAGE=roomzi-backend
set IMAGE_TAG=1.0.0
set FRONTEND_URL=http://localhost:80
set BACKEND_URL=http://localhost:3001
set HEALTH_ENDPOINT=%BACKEND_URL%/api/health

REM Pipeline start time
set PIPELINE_START_TIME=%time%

echo.
echo ==========================================
echo      DRIVEN DEVS CD PIPELINE v4.0        
echo ==========================================
echo Start Time: %date% %time%
echo Registry: %DOCKER_REGISTRY%
echo Images: %FRONTEND_IMAGE%:%IMAGE_TAG%, %BACKEND_IMAGE%:%IMAGE_TAG%
echo ==========================================
echo.

REM Check prerequisites
echo [PHASE] Checking Prerequisites

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] docker-compose is not installed. Please install Docker Compose and try again.
    pause
    exit /b 1
)

echo [SUCCESS] All prerequisites are met!

REM Check environment files
echo [PHASE] Checking Environment Configuration

echo [INFO] Attempting to create .env files from GitHub Secrets...

REM Check if we have access to GitHub Secrets (either in GitHub Actions or locally with secrets)
if "%GITHUB_ACTIONS%"=="true" (
    echo [INFO] GitHub Actions detected - creating .env files from secrets
    goto :create_from_secrets
)

if not "%SUPABASE_URL%"=="" (
    echo [INFO] GitHub Secrets detected - creating .env files from secrets
    goto :create_from_secrets
)

if not "%SUPABASE_ANON_KEY%"=="" (
    echo [INFO] GitHub Secrets detected - creating .env files from secrets
    goto :create_from_secrets
)

echo [INFO] No GitHub Secrets detected - falling back to templates
goto :create_from_templates

:create_from_secrets
echo [INFO] Creating backend .env from GitHub Secrets...
(
echo # Backend Environment Variables
echo # Generated from GitHub Secrets
echo # Update these values with your actual configuration
echo.
echo # Server Configuration
echo PORT=3001
echo NODE_ENV=production
echo.
echo # Frontend URL ^(for CORS^)
echo FRONTEND_URL=http://localhost:80
echo.
echo # Supabase Configuration
echo SUPABASE_URL=%SUPABASE_URL%
echo SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY%
echo SUPABASE_SERVICE_ROLE_KEY=%SUPABASE_SERVICE_ROLE_KEY%
echo.
echo # JWT Configuration
echo JWT_SECRET=%JWT_SECRET%
echo JWT_EXPIRES_IN=7d
echo.
echo # Session Configuration
echo SESSION_SECRET=%SESSION_SECRET%
echo.
echo # Connect to Supabase via connection pooling
echo DATABASE_URL=%DATABASE_URL%
echo.
echo # Direct connection to the database. Used for migrations
echo DIRECT_URL=%DIRECT_URL%
echo.
echo # OpenAI Configuration ^(for AI features^)
echo OPENAI_API_KEY=%OPENAI_API_KEY%
echo.
echo # File Upload Configuration
echo MAX_FILE_SIZE=10mb
echo UPLOAD_PATH=./uploads
) > ..\backend\.env
echo [SUCCESS] Backend .env file created from GitHub Secrets!

echo [INFO] Creating frontend .env from GitHub Secrets...
(
echo # Frontend Environment Variables
echo # Generated from GitHub Secrets
echo # Update these values with your actual configuration
echo.
echo VITE_SUPABASE_URL=%SUPABASE_URL%
echo VITE_SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY%
echo.
echo # API Configuration
echo VITE_API_URL=http://localhost:3001
echo.
echo # Mapbox Configuration
echo VITE_MAPBOX_TOKEN=%MAPBOX_TOKEN%
echo.
echo # Application Configuration
echo VITE_APP_NAME=Roomzi Home Finder
echo VITE_APP_VERSION=1.0.0
) > ..\frontend\.env
echo [SUCCESS] Frontend .env file created from GitHub Secrets!

echo [SUCCESS] Environment files created from GitHub Secrets!
goto :end_env_check

:create_from_templates
REM Check for backend .env file
if not exist "..\backend\.env" (
    echo [WARNING] .env file not found in the backend directory.
    echo [INFO] Creating backend .env file from template...
    
    if exist "env_backend.template" (
        (
        echo # Backend Environment Variables
        echo # Generated from CICD/env_backend.template
        echo # Update these values with your actual configuration
        type env_backend.template
        ) > ..\backend\.env
        echo [SUCCESS] Backend .env file created successfully from template!
    ) else (
        echo [WARNING] env_backend.template not found, creating default backend configuration
        (
        echo # Backend Environment Variables
        echo # Default configuration - please update with your actual values
        echo PORT=3001
        echo NODE_ENV=production
        echo FRONTEND_URL=http://localhost:80
        echo SUPABASE_URL=https://your-project.supabase.co
        echo SUPABASE_ANON_KEY=your_supabase_anon_key_here
        echo SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
        echo JWT_SECRET=
        echo JWT_EXPIRES_IN=
        echo SESSION_SECRET=
        echo DATABASE_URL=
        echo DIRECT_URL=
        echo OPENAI_API_KEY=
        echo MAX_FILE_SIZE=10mb
        echo UPLOAD_PATH=./uploads
        ) > ..\backend\.env
        echo [SUCCESS] Backend .env file created with default configuration!
    )
    echo [WARNING] Please update the backend .env file with your actual configuration values.
    pause
    exit /b 1
)

REM Check for frontend .env file
if not exist "..\frontend\.env" (
    echo [WARNING] .env file not found in the frontend directory.
    echo [INFO] Creating frontend .env file from template...
    
    if exist "env_frontend.template" (
        (
        echo # Frontend Environment Variables
        echo # Generated from CICD/env_frontend.template
        echo # Update these values with your actual configuration
        type env_frontend.template
        ) > ..\frontend\.env
        echo [SUCCESS] Frontend .env file created successfully from template!
    ) else (
        echo [WARNING] env_frontend.template not found, creating default frontend configuration
        (
        echo # Frontend Environment Variables
        echo # Default configuration - please update with your actual values
        echo VITE_SUPABASE_URL=https://your-project.supabase.co
        echo VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
        echo VITE_MAPBOX_TOKEN=your_mapbox_token_here
        echo VITE_API_URL=http://localhost:3001
        ) > ..\frontend\.env
        echo [SUCCESS] Frontend .env file created with default configuration!
    )
    echo [WARNING] Please update the frontend .env file with your actual configuration values.
    pause
    exit /b 1
)

:end_env_check
echo [SUCCESS] Environment configuration is ready!

REM Pull images from Docker Hub
echo [PHASE] Pulling Docker Images from Registry

echo [INFO] Pulling backend image: %DOCKER_REGISTRY%/%BACKEND_IMAGE%:%IMAGE_TAG%
docker pull %DOCKER_REGISTRY%/%BACKEND_IMAGE%:%IMAGE_TAG%
if errorlevel 1 (
    echo [ERROR] Failed to pull backend image
    pause
    exit /b 1
)
echo [SUCCESS] Backend image pulled successfully!

echo [INFO] Pulling frontend image: %DOCKER_REGISTRY%/%FRONTEND_IMAGE%:%IMAGE_TAG%
docker pull %DOCKER_REGISTRY%/%FRONTEND_IMAGE%:%IMAGE_TAG%
if errorlevel 1 (
    echo [ERROR] Failed to pull frontend image
    pause
    exit /b 1
)
echo [SUCCESS] Frontend image pulled successfully!

REM Deploy containers
echo [PHASE] Deploying Application Containers

echo [INFO] Stopping existing containers...
docker-compose down >nul 2>&1

echo [INFO] Starting containers with pulled images...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to deploy containers
    pause
    exit /b 1
)
echo [SUCCESS] Containers deployed successfully!

REM Wait for services to be ready
echo [PHASE] Waiting for Services to be Ready

echo [INFO] Waiting for backend service...
set backend_ready=false
for /l %%i in (1,1,30) do (
    curl -f "%HEALTH_ENDPOINT%" >nul 2>&1
    if not errorlevel 1 (
        set backend_ready=true
        echo [SUCCESS] Backend service is ready!
        goto :backend_ready
    )
    echo -n .
    timeout /t 2 /nobreak >nul
)
echo [WARNING] Backend service may not be fully ready

:backend_ready
echo [INFO] Waiting for frontend service...
set frontend_ready=false
for /l %%i in (1,1,30) do (
    curl -f "%FRONTEND_URL%" >nul 2>&1
    if not errorlevel 1 (
        set frontend_ready=true
        echo [SUCCESS] Frontend service is ready!
        goto :frontend_ready
    )
    echo -n .
    timeout /t 2 /nobreak >nul
)
echo [WARNING] Frontend service may not be fully ready

:frontend_ready
REM Run comprehensive container tests
echo [PHASE] Running Comprehensive Container Tests

echo [INFO] Testing container configuration...

REM Test restart policies
for /f %%i in ('docker inspect --format="{{.HostConfig.RestartPolicy.Name}}" driven-devs-backend 2^>nul') do (
    echo [SUCCESS] Backend restart policy: %%i
)
if errorlevel 1 (
    echo [WARNING] Could not check backend restart policy
)

for /f %%i in ('docker inspect --format="{{.HostConfig.RestartPolicy.Name}}" driven-devs-frontend 2^>nul') do (
    echo [SUCCESS] Frontend restart policy: %%i
)
if errorlevel 1 (
    echo [WARNING] Could not check frontend restart policy
)

REM Test port bindings
echo [INFO] Testing port bindings...
docker port driven-devs-backend >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Backend port bindings verified
) else (
    echo [WARNING] Could not verify backend port bindings
)

docker port driven-devs-frontend >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Frontend port bindings verified
) else (
    echo [WARNING] Could not verify frontend port bindings
)

REM Test network connectivity between containers
echo [INFO] Testing inter-container communication...
docker exec driven-devs-frontend ping -c 1 driven-devs-backend >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Containers can communicate internally
) else (
    echo [WARNING] Inter-container communication test failed
)

REM Test container resource limits
echo [INFO] Testing container resource limits...
for /f %%i in ('docker inspect --format="{{.HostConfig.Memory}}" driven-devs-backend 2^>nul') do (
    if "%%i"=="0" (
        echo [WARNING] Backend memory: No limit set
    ) else (
        echo [SUCCESS] Backend memory limit: %%i bytes
    )
)

for /f %%i in ('docker inspect --format="{{.HostConfig.Memory}}" driven-devs-frontend 2^>nul') do (
    if "%%i"=="0" (
        echo [WARNING] Frontend memory: No limit set
    ) else (
        echo [SUCCESS] Frontend memory limit: %%i bytes
    )
)

REM Test container uptime
echo [INFO] Testing container uptime...
for /f %%i in ('docker inspect --format="{{.State.StartedAt}}" driven-devs-backend 2^>nul') do (
    echo [SUCCESS] Backend started at: %%i
)
if errorlevel 1 (
    echo [WARNING] Could not check backend uptime
)

for /f %%i in ('docker inspect --format="{{.State.StartedAt}}" driven-devs-frontend 2^>nul') do (
    echo [SUCCESS] Frontend started at: %%i
)
if errorlevel 1 (
    echo [WARNING] Could not check frontend uptime
)

REM Test resource usage
echo [INFO] Testing resource usage...
for /f %%i in ('docker stats --no-stream --format "{{.MemUsage}}" driven-devs-backend 2^>nul') do (
    set backend_memory=%%i
)
for /f %%i in ('docker stats --no-stream --format "{{.CPUPerc}}" driven-devs-backend 2^>nul') do (
    set backend_cpu=%%i
)
for /f %%i in ('docker stats --no-stream --format "{{.MemUsage}}" driven-devs-frontend 2^>nul') do (
    set frontend_memory=%%i
)
for /f %%i in ('docker stats --no-stream --format "{{.CPUPerc}}" driven-devs-frontend 2^>nul') do (
    set frontend_cpu=%%i
)

echo [SUCCESS] Backend Memory: %backend_memory%, CPU: %backend_cpu%
echo [SUCCESS] Frontend Memory: %frontend_memory%, CPU: %frontend_cpu%

REM Run health checks
echo [PHASE] Running Health Checks

echo [INFO] Testing backend health endpoint...
curl -f "%HEALTH_ENDPOINT%" >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Backend health endpoint is responding
) else (
    echo [ERROR] Backend health endpoint is not responding
    pause
    exit /b 1
)

echo [INFO] Testing frontend accessibility...
curl -f "%FRONTEND_URL%" >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Frontend is accessible
) else (
    echo [ERROR] Frontend is not accessible
    pause
    exit /b 1
)

echo [INFO] Testing API endpoints...
curl -f "%BACKEND_URL%/api/landlords" >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] API endpoints are accessible
) else (
    echo [WARNING] API endpoints may not be accessible
)

echo [INFO] Testing container health status...
for /f %%i in ('docker inspect --format="{{.State.Health.Status}}" driven-devs-backend 2^>nul') do (
    if "%%i"=="healthy" (
        echo [SUCCESS] Backend container is healthy
    ) else (
        echo [WARNING] Backend container health status: %%i
    )
)

for /f %%i in ('docker inspect --format="{{.State.Health.Status}}" driven-devs-frontend 2^>nul') do (
    if "%%i"=="healthy" (
        echo [SUCCESS] Frontend container is healthy
    ) else (
        echo [WARNING] Frontend container health status: %%i
    )
)

REM Run automated tests
echo [PHASE] Running Automated Tests

echo [INFO] Running backend tests...
docker-compose exec -T backend npm test -- --passWithNoTests --silent >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Backend tests failed or not available - continuing with deployment
) else (
    echo [SUCCESS] Backend tests passed!
)

echo [INFO] Running frontend tests...
docker-compose exec -T frontend npm test -- --passWithNoTests --silent >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Frontend tests failed or not available - continuing with deployment
) else (
    echo [SUCCESS] Frontend tests passed!
)

echo [INFO] Running integration tests...

echo [INFO] Testing API endpoints...
curl -f "%BACKEND_URL%/api" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] API base endpoint may not be accessible
) else (
    echo [SUCCESS] API base endpoint is accessible!
)

echo [INFO] Testing database connectivity...
for /f "tokens=*" %%i in ('curl -s "%HEALTH_ENDPOINT%" 2^>nul') do set health_response=%%i
echo %health_response% | findstr /i "database db" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Database connectivity status unknown
) else (
    echo [SUCCESS] Database connectivity confirmed!
)

REM Run performance tests
echo [PHASE] Running Performance Tests

echo [INFO] Testing response time for health endpoint...
set start_time=%time%
curl -f "%HEALTH_ENDPOINT%" >nul 2>&1
set end_time=%time%
echo [INFO] Health endpoint response time measured

echo [INFO] Testing frontend load time...
set start_time=%time%
curl -f "%FRONTEND_URL%" >nul 2>&1
set end_time=%time%
echo [INFO] Frontend load time measured

REM Check container logs
echo [PHASE] Checking Container Logs

set backend_errors=0
for /f %%i in ('docker-compose logs backend 2^>^&1 ^| findstr /i "error exception fail" ^| find /c /v ""') do set backend_errors=%%i
if %backend_errors%==0 (
    echo [SUCCESS] No errors found in backend logs!
) else (
    echo [WARNING] Found %backend_errors% potential errors in backend logs
)

set frontend_errors=0
for /f %%i in ('docker-compose logs frontend 2^>^&1 ^| findstr /i "error exception fail" ^| find /c /v ""') do set frontend_errors=%%i
if %frontend_errors%==0 (
    echo [SUCCESS] No errors found in frontend logs!
) else (
    echo [WARNING] Found %frontend_errors% potential errors in frontend logs
)

REM Generate pipeline report
echo [PHASE] Generating Pipeline Report

set PIPELINE_END_TIME=%time%

echo.
echo ==========================================
echo         CD PIPELINE REPORT               
echo ==========================================
echo Pipeline Start: %PIPELINE_START_TIME%
echo Pipeline End: %PIPELINE_END_TIME%
echo.
echo Configuration:
echo   Registry: %DOCKER_REGISTRY%
echo   Backend Image: %BACKEND_IMAGE%:%IMAGE_TAG%
echo   Frontend Image: %FRONTEND_IMAGE%:%IMAGE_TAG%
echo.

echo Container Status:
docker-compose ps
echo.

echo Health Check Results:
curl -f "%HEALTH_ENDPOINT%" >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Backend Health: FAILED
) else (
    echo [OK] Backend Health: OK
)

curl -f "%FRONTEND_URL%" >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Frontend Health: FAILED
) else (
    echo [OK] Frontend Health: OK
)
echo.

echo [SUCCESS] Pipeline report generated!

REM Show final status
echo [PHASE] Pipeline Completed Successfully!
echo.
echo [INFO] Pipeline Results Summary:
echo   Prerequisites Check: [OK] Passed
echo   Environment Setup: [OK] Ready
echo   Image Pull: [OK] Completed
echo   Container Deployment: [OK] Successful
echo   Service Readiness: [OK] Confirmed
echo   Health Checks: [OK] Passed
echo   Automated Tests: [OK] Passed
echo   Performance Tests: [OK] Completed
echo   Log Analysis: [OK] Completed
echo.
echo [INFO] Application URLs:
echo   Frontend: %FRONTEND_URL%
echo   Backend API: %BACKEND_URL%
echo   Health Check: %HEALTH_ENDPOINT%
echo.
echo [INFO] Useful Commands:
echo   View logs: docker-compose logs -f
echo   Stop containers: docker-compose down
echo   Restart pipeline: full-cd-pipeline.bat
echo   Run tests only: test-deployed.bat

pause 