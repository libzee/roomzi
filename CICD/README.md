# Docker Setup for Driven Devs Application

This directory contains Docker configuration files for containerizing the Driven Devs housing platform application.

## Overview

The application consists of two main services:
- **Frontend**: React application built with Vite, served by Nginx
- **Backend**: Node.js Express API with Prisma ORM

## Recent Updates (v2.0)

### 🚀 Major Improvements
- **Node.js 20**: Upgraded from Node.js 18 to Node.js 20 for better performance and security
- **Enhanced Security**: Non-root user execution, improved security headers, and better CSP policies
- **Health Checks**: Comprehensive health check endpoints and Docker health checks
- **Resource Management**: CPU and memory limits for better resource utilization
- **Performance**: Optimized Nginx configuration with better caching and compression
- **Error Handling**: Improved error handling and logging throughout the deployment process

### 🔧 Technical Enhancements
- **Multi-stage Builds**: Optimized Docker builds for smaller image sizes
- **Security Headers**: Enhanced Content Security Policy and security headers
- **File Upload Support**: Better handling of file uploads with proper size limits
- **WebSocket Support**: Improved WebSocket proxy configuration for real-time features
- **Environment Management**: Better environment variable templates and validation

## Files Structure

```
CICD/
├── Dockerfile.backend      # Backend container configuration (Node.js 20)
├── Dockerfile.frontend     # Frontend container configuration (Node.js 20 + Nginx)
├── docker-compose.yml      # Multi-service orchestration with health checks
├── nginx.conf             # Optimized Nginx configuration with security headers
├── .dockerignore          # Comprehensive file exclusion for Docker builds
├── deploy.sh              # Enhanced deployment script with health checks
├── deploy.bat             # Windows deployment script
├── test-deployed.sh       # Testing script with comprehensive validation
├── test-deployed.bat      # Windows testing script
├── full-cd-pipeline.sh    # Complete CD pipeline (Linux/Mac)
├── full-cd-pipeline.bat   # Complete CD pipeline (Windows)
├── env_backend.template   # Backend environment template (updated)
├── env_frontend.template  # Frontend environment template (updated)
└── README.md              # This file
```

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB of available RAM
- curl (for health checks)

## Quick Start

### Option 1: Complete CD Pipeline (Recommended)
Run the full Continuous Delivery pipeline that pulls images from Docker Hub and runs automated tests:

**Linux/Mac:**
```bash
cd CICD
chmod +x *.sh
./full-cd-pipeline.sh
```

**Windows (Command Prompt):**
```cmd
cd CICD
full-cd-pipeline.bat
```

**Windows (PowerShell):**
```powershell
cd CICD
.\full-cd-pipeline.bat
```

### Option 2: Manual Deployment
1. **Clone the repository and navigate to the CICD directory:**
   ```bash
   cd CICD
   ```

2. **Set up environment variables:**
   The pipeline will automatically create environment files if they don't exist:
   
   **Backend** (`backend/.env`):
   ```env
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=http://localhost:80
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   SESSION_SECRET=your_session_secret
   DATABASE_URL=your_database_connection_string
   DIRECT_URL=your_direct_database_connection_string
   OPENAI_API_KEY=your_openai_api_key
   MAX_FILE_SIZE=10mb
   UPLOAD_PATH=./uploads
   ```
   
   **Frontend** (`frontend/.env`):
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:3001
   VITE_MAPBOX_TOKEN=your_mapbox_token
   VITE_APP_NAME=Roomzi Home Finder
   VITE_APP_VERSION=1.0.0
   ```

3. **Deploy from Docker Hub:**
   ```bash
   # Linux/Mac
   ./deploy.sh
   
   # Windows (Command Prompt)
   deploy.bat
   
   # Windows (PowerShell)
   .\deploy.bat
   ```

4. **Run automated tests:**
   ```bash
   # Linux/Mac
   ./test-deployed.sh
   
   # Windows (Command Prompt)
   test-deployed.bat
   
   # Windows (PowerShell)
   .\test-deployed.bat
   ```

5. **Access the application:**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/api/health

## CD Pipeline Scripts

### Complete CD Pipeline
The `full-cd-pipeline.sh` (Linux/Mac) and `full-cd-pipeline.bat` (Windows) scripts implement a complete Continuous Delivery pipeline:

1. **Prerequisites Check** - Verifies Docker and required tools
2. **Environment Setup** - Validates configuration files
3. **Image Pull** - Downloads images from Docker Hub
4. **Container Deployment** - Deploys application containers
5. **Service Readiness** - Waits for services to be ready
6. **Health Checks** - Validates application health
7. **Automated Testing** - Runs backend and frontend tests
8. **Performance Testing** - Measures response times
9. **Log Analysis** - Checks for errors in container logs
10. **Report Generation** - Creates comprehensive deployment report

### Individual Scripts

#### Deployment Scripts
- `deploy.sh` / `deploy.bat` - Pull images from Docker Hub and deploy containers
- `build.sh` / `build.bat` - Build images locally and deploy (for development)

#### Testing Scripts
- `test-deployed.sh` / `test-deployed.bat` - Run automated tests against deployed containers

#### PowerShell Usage
For Windows PowerShell users, prefix batch files with `.\`:
```powershell
.\deploy.bat
.\test-deployed.bat
.\full-cd-pipeline.bat
```

### Manual Commands

#### Pull Images from Docker Hub
```bash
docker pull thushshan/roomzi-backend:1.0.0
docker pull thushshan/roomzi-frontend:1.0.0
```

#### Run Backend Container
```bash
docker run -p 3001:3001 --env-file backend/.env thushshan/roomzi-backend:1.0.0
```

#### Run Frontend Container
```bash
docker run -p 80:80 thushshan/roomzi-frontend:1.0.0
```

## Development Setup

For development, you can use the following commands:

### Development with Volume Mounting
```bash
# Backend with hot reload
docker run -p 3001:3001 -v $(pwd)/backend:/app -v /app/node_modules driven-devs-backend npm run dev

# Frontend with hot reload
docker run -p 8080:8080 -v $(pwd)/frontend:/app -v /app/node_modules driven-devs-frontend npm run dev
```

## Production Deployment

### Using CD Pipeline (Recommended)
```bash
# Linux/Mac - Run complete CD pipeline
./full-cd-pipeline.sh

# Windows (Command Prompt) - Run complete CD pipeline
full-cd-pipeline.bat

# Windows (PowerShell) - Run complete CD pipeline
.\full-cd-pipeline.bat

# Or run individual phases
./deploy.sh          # Linux/Mac
deploy.bat           # Windows (Command Prompt)
.\deploy.bat         # Windows (PowerShell)
./test-deployed.sh   # Linux/Mac
test-deployed.bat    # Windows (Command Prompt)
.\test-deployed.bat  # Windows (PowerShell)
```

### Using Docker Compose
```bash
# Deploy using pulled images
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Using Docker Swarm
```bash
# Initialize swarm (if not already done)
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml driven-devs
```

## Environment Variables

### Backend Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `FRONTEND_URL`: Frontend application URL
- `PORT`: Backend server port (default: 3001)
- `NODE_ENV`: Environment mode (production/development)
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: JWT expiration time
- `SESSION_SECRET`: Session secret
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `MAX_FILE_SIZE`: Maximum file upload size
- `UPLOAD_PATH`: File upload directory

### Frontend Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_API_URL`: Backend API URL
- `VITE_MAPBOX_TOKEN`: Mapbox API token
- `VITE_APP_NAME`: Application name
- `VITE_APP_VERSION`: Application version

## Database Setup

The backend uses Prisma ORM. Before running the containers:

1. **Generate Prisma client:**
   ```bash
   cd backend
   npx prisma generate
   ```

2. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Seed the database (optional):**
   ```bash
   npm run db:seed
   ```

## Security Features

### Container Security
- **Non-root Users**: Both frontend and backend containers run as non-root users
- **Security Headers**: Comprehensive security headers in Nginx configuration
- **Content Security Policy**: Strict CSP policy for XSS protection
- **Resource Limits**: CPU and memory limits to prevent resource exhaustion

### Network Security
- **Isolated Networks**: Services communicate through Docker networks
- **Port Exposure**: Only necessary ports are exposed
- **Proxy Headers**: Proper proxy headers for load balancer support

### File Security
- **Upload Validation**: File size and type validation
- **Secure File Handling**: Proper file permissions and ownership
- **Environment Isolation**: Sensitive data kept in environment variables

## Performance Optimization

### Multi-stage Builds
The Dockerfiles use multi-stage builds to:
- Reduce final image size
- Separate build dependencies from runtime
- Improve build caching

### Nginx Configuration
The frontend uses Nginx with:
- Gzip compression (level 6)
- Static asset caching (1 year)
- Security headers
- React Router support
- WebSocket proxy support
- File upload handling

### Resource Management
- **Memory Limits**: Backend: 512MB, Frontend: 256MB
- **CPU Limits**: Backend: 0.5 CPU, Frontend: 0.25 CPU
- **Health Checks**: Regular health monitoring
- **Connection Pooling**: Keepalive connections

### Volume Management
- Uploads are persisted using Docker volumes
- Database data should be stored in external volumes for production

## Health Checks

### Health Check Endpoints
- Backend: `GET /api/health`
- Frontend: `GET /health`

### Docker Health Checks
- Backend: Checks API health endpoint every 30s
- Frontend: Checks web server accessibility every 30s

### Monitoring Commands
```bash
# Check container status
docker-compose ps

# Monitor resource usage
docker stats

# Check container health
docker inspect --format='{{.State.Health.Status}}' container_name

# View health check logs
docker inspect --format='{{json .State.Health}}' container_name
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Ensure ports 80 and 3001 are available
   - Modify ports in `docker-compose.yml` if needed

2. **Database connection issues:**
   - Verify `DATABASE_URL` is correct
   - Ensure database is accessible from container

3. **Build failures:**
   - Clear Docker cache: `docker system prune -a`
   - Check for syntax errors in Dockerfiles

4. **Permission issues:**
   - Ensure proper file permissions
   - Check Docker user permissions

5. **Health check failures:**
   - Check container logs: `docker-compose logs`
   - Verify environment variables are set correctly
   - Ensure services are starting properly

### Logs and Debugging

```bash
# View all container logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f

# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh

# Check health status
docker-compose ps
```

## Backup and Recovery

### Database Backups
```bash
# Create backup
docker-compose exec backend npx prisma db pull

# Restore from backup
docker-compose exec backend npx prisma db push
```

### Volume Backups
```bash
# Backup uploads volume
docker run --rm -v driven-devs_backend_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# Restore uploads volume
docker run --rm -v driven-devs_backend_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

## CD Pipeline Implementation

### Part 2 Requirements Fulfillment

This implementation satisfies the Part 2 CD Pipeline requirements:

#### 1. Pull and Deploy Container (10 marks) ✅
- **Automated Image Pull**: Scripts automatically pull `thushshan/roomzi-frontend:1.0.0` and `thushshan/roomzi-backend:1.0.0` from Docker Hub
- **Container Deployment**: Uses docker-compose to deploy containers with proper orchestration
- **Health Checks**: Validates that services are ready before proceeding
- **Error Handling**: Comprehensive error checking and rollback capabilities

#### 2. Automated Testing (10 marks) ✅
- **Backend Tests**: Runs Jest tests inside the backend container
- **Frontend Tests**: Runs Vitest tests inside the frontend container
- **Integration Tests**: Tests API endpoints and database connectivity
- **Performance Tests**: Measures response times for health endpoints
- **Log Analysis**: Checks container logs for errors and warnings
- **Test Reports**: Generates comprehensive test reports

### Pipeline Phases

1. **Prerequisites Check** - Validates Docker, docker-compose, and curl availability
2. **Environment Setup** - Checks for required configuration files
3. **Image Pull** - Downloads latest images from Docker Hub registry
4. **Container Deployment** - Deploys application using docker-compose
5. **Service Readiness** - Waits for services to be fully operational
6. **Health Checks** - Validates application endpoints are responding
7. **Automated Testing** - Runs comprehensive test suites
8. **Performance Testing** - Measures application performance metrics
9. **Log Analysis** - Reviews container logs for issues
10. **Report Generation** - Creates detailed deployment and test reports

### Usage Examples

```bash
# Linux/Mac - Run complete CD pipeline
./full-cd-pipeline.sh

# Windows (Command Prompt) - Run complete CD pipeline
full-cd-pipeline.bat

# Windows (PowerShell) - Run complete CD pipeline
.\full-cd-pipeline.bat

# Deploy only (pull and deploy containers)
./deploy.sh          # Linux/Mac
deploy.bat           # Windows (Command Prompt)
.\deploy.bat         # Windows (PowerShell)

# Test only (run tests against deployed containers)
./test-deployed.sh   # Linux/Mac
test-deployed.bat    # Windows (Command Prompt)
.\test-deployed.bat  # Windows (PowerShell)

# Build locally (for development)
./build.sh           # Linux/Mac
build.bat            # Windows (Command Prompt)
.\build.bat          # Windows (PowerShell)
```

## Contributing

When making changes to the Docker configuration:

1. Test locally with `docker-compose up --build`
2. Update this README if configuration changes
3. Ensure all environment variables are documented
4. Test both development and production builds
5. Update CD pipeline scripts if deployment process changes
6. Run security scans on the final images
7. Test health checks and monitoring

## License

This Docker configuration is part of the Driven Devs project. 