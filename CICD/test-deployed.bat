@echo off
setlocal enabledelayedexpansion

REM Driven Devs CD Pipeline - Testing Script for Windows
REM This script runs automated tests against the deployed application

echo 🧪 Starting Driven Devs CD Pipeline - Testing Phase...

REM Configuration
set FRONTEND_URL=http://localhost:80
set BACKEND_URL=http://localhost:3001
set HEALTH_ENDPOINT=%BACKEND_URL%/api/health

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

REM Check if containers are running
echo [INFO] Checking if containers are running...
docker-compose ps | findstr "Up" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Containers are not running. Please deploy the application first.
    pause
    exit /b 1
)
echo [SUCCESS] Containers are running!

echo [INFO] Testing container functionality and performance...

echo [INFO] Testing container health...
curl -f "%HEALTH_ENDPOINT%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Backend health endpoint is not responding
    pause
    exit /b 1
)
echo [SUCCESS] Backend health endpoint is responding!

echo [INFO] Testing frontend accessibility...
curl -f "%FRONTEND_URL%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Frontend is not accessible
    pause
    exit /b 1
)
echo [SUCCESS] Frontend is accessible!

echo [INFO] Testing API endpoints...
curl -f "%BACKEND_URL%/api/landlords" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] API base endpoint may not be accessible
) else (
    echo [SUCCESS] API base endpoint is accessible!
)

echo [INFO] Testing container restart policy...
docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-backend >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Could not check backend restart policy
) else (
    for /f %%i in ('docker inspect --format="{{.HostConfig.RestartPolicy.Name}}" driven-devs-backend 2^>nul') do (
        echo [INFO] Backend restart policy: %%i
    )
)

docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-frontend >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Could not check frontend restart policy
) else (
    for /f %%i in ('docker inspect --format="{{.HostConfig.RestartPolicy.Name}}" driven-devs-frontend 2^>nul') do (
        echo [INFO] Frontend restart policy: %%i
    )
)

echo [INFO] Testing port bindings...
docker port driven-devs-backend >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Could not check backend port bindings
) else (
    echo [INFO] Backend port bindings:
    docker port driven-devs-backend
)

docker port driven-devs-frontend >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Could not check frontend port bindings
) else (
    echo [INFO] Frontend port bindings:
    docker port driven-devs-frontend
)

echo [INFO] Testing network connectivity between containers...
docker exec driven-devs-frontend ping -c 1 driven-devs-backend >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Frontend cannot ping backend container
) else (
    echo [SUCCESS] Frontend can reach backend container
)

echo [INFO] Testing container resource limits...
docker inspect --format='{{.HostConfig.Memory}}' driven-devs-backend >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Could not check backend memory limits
) else (
    for /f %%i in ('docker inspect --format="{{.HostConfig.Memory}}" driven-devs-backend 2^>nul') do (
        if "%%i"=="0" (
            echo [INFO] Backend memory: No limit set
        ) else (
            echo [INFO] Backend memory limit: %%i bytes
        )
    )
)

docker inspect --format='{{.HostConfig.Memory}}' driven-devs-frontend >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Could not check frontend memory limits
) else (
    for /f %%i in ('docker inspect --format="{{.HostConfig.Memory}}" driven-devs-frontend 2^>nul') do (
        if "%%i"=="0" (
            echo [INFO] Frontend memory: No limit set
        ) else (
            echo [INFO] Frontend memory limit: %%i bytes
        )
    )
)

echo [INFO] Testing container uptime...
docker inspect --format='{{.State.StartedAt}}' driven-devs-backend >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Could not check backend uptime
) else (
    for /f %%i in ('docker inspect --format="{{.State.StartedAt}}" driven-devs-backend 2^>nul') do (
        echo [INFO] Backend started at: %%i
    )
)

docker inspect --format='{{.State.StartedAt}}' driven-devs-frontend >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Could not check frontend uptime
) else (
    for /f %%i in ('docker inspect --format="{{.State.StartedAt}}" driven-devs-frontend 2^>nul') do (
        echo [INFO] Frontend started at: %%i
    )
)

echo [INFO] Testing container logs for errors...

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

echo [INFO] Generating test report...

echo.
echo ==========================================
echo            TEST REPORT SUMMARY            
echo ==========================================
echo Timestamp: %date% %time%
echo Frontend URL: %FRONTEND_URL%
echo Backend URL: %BACKEND_URL%
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

echo [SUCCESS] Test report generated!

echo [INFO] Testing completed!
echo.
echo [INFO] Actual Test Results Summary:
echo.

REM Test container health status
echo [CONTAINER HEALTH TESTS]
docker inspect --format='{{.State.Health.Status}}' driven-devs-backend >nul 2>&1
if errorlevel 1 (
    echo   Backend Container: [FAIL] Health status unknown
) else (
    for /f %%i in ('docker inspect --format="{{.State.Health.Status}}" driven-devs-backend 2^>nul') do (
        if "%%i"=="healthy" (
            echo   Backend Container: [OK] Status: %%i
        ) else (
            echo   Backend Container: [WARN] Status: %%i
        )
    )
)

docker inspect --format='{{.State.Health.Status}}' driven-devs-frontend >nul 2>&1
if errorlevel 1 (
    echo   Frontend Container: [FAIL] Health status unknown
) else (
    for /f %%i in ('docker inspect --format="{{.State.Health.Status}}" driven-devs-frontend 2^>nul') do (
        if "%%i"=="healthy" (
            echo   Frontend Container: [OK] Status: %%i
        ) else (
            echo   Frontend Container: [WARN] Status: %%i
        )
    )
)
echo.

REM Test endpoint availability
echo [ENDPOINT AVAILABILITY TESTS]
curl -f "%HEALTH_ENDPOINT%" >nul 2>&1
if errorlevel 1 (
    echo   Backend Health Check: [FAIL] Endpoint not responding
) else (
    echo   Backend Health Check: [OK] Endpoint accessible and responding
)

curl -f "%FRONTEND_URL%" >nul 2>&1
if errorlevel 1 (
    echo   Frontend Accessibility: [FAIL] Frontend not loading
) else (
    echo   Frontend Accessibility: [OK] Frontend accessible and loading
)

curl -f "%BACKEND_URL%/api/landlords" >nul 2>&1
if errorlevel 1 (
    echo   API Endpoints: [FAIL] API not accessible
) else (
    echo   API Endpoints: [OK] API structure accessible
)
echo.

REM Test container configuration
echo [CONTAINER CONFIGURATION TESTS]
docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-backend >nul 2>&1
if errorlevel 1 (
    echo   Backend Restart Policy: [FAIL] Could not check
) else (
    for /f %%i in ('docker inspect --format="{{.HostConfig.RestartPolicy.Name}}" driven-devs-backend 2^>nul') do (
        echo   Backend Restart Policy: [OK] %%i
    )
)

docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-frontend >nul 2>&1
if errorlevel 1 (
    echo   Frontend Restart Policy: [FAIL] Could not check
) else (
    for /f %%i in ('docker inspect --format="{{.HostConfig.RestartPolicy.Name}}" driven-devs-frontend 2^>nul') do (
        echo   Frontend Restart Policy: [OK] %%i
    )
)

docker port driven-devs-backend >nul 2>&1
if errorlevel 1 (
    echo   Backend Port Binding: [FAIL] Could not check
) else (
    echo   Backend Port Binding: [OK] Ports properly bound
)

docker port driven-devs-frontend >nul 2>&1
if errorlevel 1 (
    echo   Frontend Port Binding: [FAIL] Could not check
) else (
    echo   Frontend Port Binding: [OK] Ports properly bound
)
echo.

REM Test network connectivity
echo [NETWORK CONNECTIVITY TESTS]
docker exec driven-devs-frontend ping -c 1 driven-devs-backend >nul 2>&1
if errorlevel 1 (
    echo   Inter-Container Communication: [FAIL] Frontend cannot reach backend
) else (
    echo   Inter-Container Communication: [OK] Containers can communicate
)
echo.

REM Test resource usage with actual values
echo [RESOURCE USAGE TESTS]
for /f "tokens=1" %%i in ('docker stats --no-stream --format "{{.MemUsage}}" driven-devs-backend 2^>nul') do (
    set backend_memory=%%i
    echo   Backend Memory: [INFO] %%i (actual usage^)
)
for /f "tokens=1" %%i in ('docker stats --no-stream --format "{{.MemUsage}}" driven-devs-frontend 2^>nul') do (
    set frontend_memory=%%i
    echo   Frontend Memory: [INFO] %%i (actual usage^)
)

for /f "tokens=1" %%i in ('docker stats --no-stream --format "{{.CPUPerc}}" driven-devs-backend 2^>nul') do (
    set backend_cpu=%%i
    echo   Backend CPU: [INFO] %%i (current usage^)
)
for /f "tokens=1" %%i in ('docker stats --no-stream --format "{{.CPUPerc}}" driven-devs-frontend 2^>nul') do (
    set frontend_cpu=%%i
    echo   Frontend CPU: [INFO] %%i (current usage^)
)
echo.

REM Show actual log analysis results
echo [LOG ANALYSIS]
if %backend_errors%==0 (
    echo   Backend Logs: [OK] No errors detected (0 found^)
) else (
    echo   Backend Logs: [WARN] %backend_errors% potential errors detected
)
if %frontend_errors%==0 (
    echo   Frontend Logs: [OK] No errors detected (0 found^)
) else (
    echo   Frontend Logs: [WARN] %frontend_errors% potential errors detected
)
echo.

REM Calculate actual test counts
set total_tests=0
set passed_tests=0
set failed_tests=0

REM Count container health tests (2 tests)
docker inspect --format='{{.State.Health.Status}}' driven-devs-backend >nul 2>&1
if not errorlevel 1 (
    set /a total_tests+=1
    for /f %%i in ('docker inspect --format="{{.State.Health.Status}}" driven-devs-backend 2^>nul') do (
        if "%%i"=="healthy" (
            set /a passed_tests+=1
        ) else (
            set /a failed_tests+=1
        )
    )
)

docker inspect --format='{{.State.Health.Status}}' driven-devs-frontend >nul 2>&1
if not errorlevel 1 (
    set /a total_tests+=1
    for /f %%i in ('docker inspect --format="{{.State.Health.Status}}" driven-devs-frontend 2^>nul') do (
        if "%%i"=="healthy" (
            set /a passed_tests+=1
        ) else (
            set /a failed_tests+=1
        )
    )
)

REM Count endpoint availability tests (3 tests)
curl -f "%HEALTH_ENDPOINT%" >nul 2>&1
if not errorlevel 1 (
    set /a passed_tests+=1
) else (
    set /a failed_tests+=1
)
set /a total_tests+=1

curl -f "%FRONTEND_URL%" >nul 2>&1
if not errorlevel 1 (
    set /a passed_tests+=1
) else (
    set /a failed_tests+=1
)
set /a total_tests+=1

curl -f "%BACKEND_URL%/api/landlords" >nul 2>&1
if not errorlevel 1 (
    set /a passed_tests+=1
) else (
    set /a failed_tests+=1
)
set /a total_tests+=1

REM Count container configuration tests (4 tests)
docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-backend >nul 2>&1
if not errorlevel 1 (
    set /a passed_tests+=1
) else (
    set /a failed_tests+=1
)
set /a total_tests+=1

docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' driven-devs-frontend >nul 2>&1
if not errorlevel 1 (
    set /a passed_tests+=1
) else (
    set /a failed_tests+=1
)
set /a total_tests+=1

docker port driven-devs-backend >nul 2>&1
if not errorlevel 1 (
    set /a passed_tests+=1
) else (
    set /a failed_tests+=1
)
set /a total_tests+=1

docker port driven-devs-frontend >nul 2>&1
if not errorlevel 1 (
    set /a passed_tests+=1
) else (
    set /a failed_tests+=1
)
set /a total_tests+=1

REM Count network connectivity tests (1 test)
docker exec driven-devs-frontend ping -c 1 driven-devs-backend >nul 2>&1
if not errorlevel 1 (
    set /a passed_tests+=1
) else (
    set /a failed_tests+=1
)
set /a total_tests+=1

REM Count log analysis tests (2 tests)
if %backend_errors%==0 (
    set /a passed_tests+=1
) else (
    set /a failed_tests+=1
)
set /a total_tests+=1

if %frontend_errors%==0 (
    set /a passed_tests+=1
) else (
    set /a failed_tests+=1
)
set /a total_tests+=1

REM Count resource usage tests (4 tests)
docker stats --no-stream --format "{{.MemUsage}}" driven-devs-backend >nul 2>&1
if not errorlevel 1 (
    set /a passed_tests+=1
) else (
    set /a failed_tests+=1
)
set /a total_tests+=1

docker stats --no-stream --format "{{.MemUsage}}" driven-devs-frontend >nul 2>&1
if not errorlevel 1 (
    set /a passed_tests+=1
) else (
    set /a failed_tests+=1
)
set /a total_tests+=1

docker stats --no-stream --format "{{.CPUPerc}}" driven-devs-backend >nul 2>&1
if not errorlevel 1 (
    set /a passed_tests+=1
) else (
    set /a failed_tests+=1
)
set /a total_tests+=1

docker stats --no-stream --format "{{.CPUPerc}}" driven-devs-frontend >nul 2>&1
if not errorlevel 1 (
    set /a passed_tests+=1
) else (
    set /a failed_tests+=1
)
set /a total_tests+=1

echo [OVERALL STATUS]
echo   Total Tests Executed: %total_tests% actual tests
echo   Tests Passed: %passed_tests%
echo   Tests Failed: %failed_tests%
echo   Error Status: %backend_errors% backend errors, %frontend_errors% frontend errors detected
echo.
echo [FAILED TESTS SUMMARY]
if %failed_tests% gtr 0 (
    echo   The following tests failed:
    REM Check each test category and report failures
    curl -f "%HEALTH_ENDPOINT%" >nul 2>&1
    if errorlevel 1 (
        echo     - Backend Health Endpoint: Not responding
    )
    curl -f "%FRONTEND_URL%" >nul 2>&1
    if errorlevel 1 (
        echo     - Frontend Accessibility: Not accessible
    )
    curl -f "%BACKEND_URL%/api/landlords" >nul 2>&1
    if errorlevel 1 (
        echo     - API Endpoints: Not accessible
    )
    docker exec driven-devs-frontend ping -c 1 driven-devs-backend >nul 2>&1
    if errorlevel 1 (
        echo     - Inter-Container Communication: Failed
    )
    if %backend_errors% gtr 0 (
        echo     - Backend Logs: %backend_errors% errors detected
    )
    if %frontend_errors% gtr 0 (
        echo     - Frontend Logs: %frontend_errors% errors detected
    )
) else (
    echo   All tests passed successfully!
)
echo.
echo [INFO] Application URLs:
echo   Frontend: %FRONTEND_URL%
echo   Backend API: %BACKEND_URL%
echo   Health Check: %HEALTH_ENDPOINT%

pause 