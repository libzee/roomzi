@echo off
setlocal enabledelayedexpansion

REM Driven Devs CD Pipeline - Deployment Script for Windows
REM This script pulls Docker images from Docker Hub and deploys the application

echo 🚀 Starting Driven Devs CD Pipeline - Deployment Phase...

REM Configuration
set DOCKER_REGISTRY=thushshan
set FRONTEND_IMAGE=roomzi-frontend
set BACKEND_IMAGE=roomzi-backend
set IMAGE_TAG=1.0.0

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

REM Validate environment files
echo [INFO] Validating environment configuration...

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
goto :end_env_validation

:create_from_templates
REM Check for backend .env file
if not exist "..\backend\.env" (
    echo [WARNING] Backend .env file not found. Creating from template...
    copy env_backend.template ..\backend\.env
    echo [WARNING] Please update ..\backend\.env with your actual configuration values
)

REM Check for frontend .env file
if not exist "..\frontend\.env" (
    echo [WARNING] Frontend .env file not found. Creating from template...
    copy env_frontend.template ..\frontend\.env
    echo [WARNING] Please update ..\frontend\.env with your actual configuration values
)

:end_env_validation
echo [SUCCESS] Environment validation completed

echo [INFO] Pulling Docker images from Docker Hub...

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

echo [INFO] Deploying containers...

echo [INFO] Stopping existing containers...
docker-compose down >nul 2>&1

echo [INFO] Starting containers with pulled images...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start containers
    pause
    exit /b 1
)

echo [SUCCESS] Containers deployed successfully!

echo [INFO] Waiting for services to be ready...

echo [INFO] Waiting for backend service...
set backend_ready=false
for /l %%i in (1,1,30) do (
    curl -f http://localhost:3001/api/health >nul 2>&1
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
    curl -f http://localhost:80 >nul 2>&1
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
echo [INFO] Deployment completed successfully!

echo.
echo [INFO] Container status:
docker-compose ps

echo.
echo [INFO] Application URLs:
echo   Frontend: http://localhost:80
echo   Backend API: http://localhost:3001
echo   Health Check: http://localhost:3001/api/health

echo.
echo [INFO] Useful commands:
echo   View logs: docker-compose logs -f
echo   Stop containers: docker-compose down
echo   Run tests: test-deployed.bat

REM Perform comprehensive health checks
echo [INFO] Performing comprehensive health checks...

echo [INFO] Testing backend health endpoint...
curl -f "%BACKEND_URL%/api/health" >nul 2>&1
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

echo [SUCCESS] All health checks completed successfully!

pause 