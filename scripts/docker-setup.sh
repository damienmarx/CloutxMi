#!/bin/bash

################################################################################
# CloutScape Docker Setup Script
# Configures Docker and Docker Compose for development and production
# Usage: ./scripts/docker-setup.sh [build|start|stop|logs|clean]
################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COMMAND=${1:-build}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/docker_setup.log"

################################################################################
# Utility Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

################################################################################
# Docker Validation
################################################################################

check_docker() {
    log_info "Checking Docker installation..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        log_info "Install Docker from: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        log_info "Install Docker Compose from: https://docs.docker.com/compose/install/"
        exit 1
    fi

    log_success "Docker and Docker Compose are installed"

    # Check Docker daemon
    if ! docker ps > /dev/null 2>&1; then
        log_error "Docker daemon is not running"
        log_info "Start Docker and try again"
        exit 1
    fi

    log_success "Docker daemon is running"
}

################################################################################
# Docker Build
################################################################################

build_images() {
    log_info "Building Docker images..."

    cd "$PROJECT_ROOT"

    if [[ ! -f "docker-compose.yml" ]]; then
        log_error "docker-compose.yml not found"
        exit 1
    fi

    log_info "Building images with docker-compose..."
    docker-compose build --no-cache

    log_success "Docker images built successfully"
}

################################################################################
# Docker Start
################################################################################

start_containers() {
    log_info "Starting Docker containers..."

    cd "$PROJECT_ROOT"

    log_info "Starting services..."
    docker-compose up -d

    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 10

    # Check service status
    log_info "Checking service status..."
    docker-compose ps

    log_success "Docker containers started successfully"

    # Print access information
    echo ""
    echo -e "${GREEN}Services are running:${NC}"
    echo "  - Application: http://localhost:3000"
    echo "  - API: http://localhost:3000/api"
    echo "  - Database: localhost:3306"
    echo ""
}

################################################################################
# Docker Stop
################################################################################

stop_containers() {
    log_info "Stopping Docker containers..."

    cd "$PROJECT_ROOT"

    docker-compose down

    log_success "Docker containers stopped"
}

################################################################################
# Docker Logs
################################################################################

show_logs() {
    log_info "Showing Docker logs..."

    cd "$PROJECT_ROOT"

    local service=${2:-""}

    if [[ -n "$service" ]]; then
        docker-compose logs -f "$service"
    else
        docker-compose logs -f
    fi
}

################################################################################
# Docker Clean
################################################################################

clean_docker() {
    log_warning "This will remove all CloutScape Docker containers and volumes"
    read -p "Are you sure? (yes/no): " -r
    echo

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Cleanup cancelled"
        return 0
    fi

    cd "$PROJECT_ROOT"

    log_info "Removing containers and volumes..."
    docker-compose down -v

    log_success "Docker cleanup completed"
}

################################################################################
# Docker Prune
################################################################################

prune_docker() {
    log_warning "This will remove unused Docker images, containers, and volumes"
    read -p "Are you sure? (yes/no): " -r
    echo

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Prune cancelled"
        return 0
    fi

    log_info "Pruning Docker system..."
    docker system prune -af --volumes

    log_success "Docker system pruned"
}

################################################################################
# Docker Exec
################################################################################

exec_command() {
    local service=$2
    shift 2
    local command="$@"

    if [[ -z "$service" ]]; then
        log_error "Service name required"
        exit 1
    fi

    log_info "Executing command in $service: $command"
    docker-compose exec "$service" $command
}

################################################################################
# Docker Bash
################################################################################

bash_shell() {
    local service=${2:-app}

    log_info "Opening bash shell in $service..."
    docker-compose exec "$service" bash
}

################################################################################
# Status Check
################################################################################

check_status() {
    log_info "Checking Docker status..."

    cd "$PROJECT_ROOT"

    echo ""
    echo -e "${BLUE}Docker Containers:${NC}"
    docker-compose ps

    echo ""
    echo -e "${BLUE}Docker Images:${NC}"
    docker images | grep cloutscape || echo "No CloutScape images found"

    echo ""
    echo -e "${BLUE}Docker Volumes:${NC}"
    docker volume ls | grep cloutscape || echo "No CloutScape volumes found"
}

################################################################################
# Help
################################################################################

print_help() {
    echo -e "${BLUE}CloutScape Docker Setup Script${NC}"
    echo ""
    echo "Usage: ./scripts/docker-setup.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  build              Build Docker images"
    echo "  start              Start Docker containers"
    echo "  stop               Stop Docker containers"
    echo "  restart            Restart Docker containers"
    echo "  logs [service]     Show Docker logs (optional: service name)"
    echo "  clean              Remove containers and volumes"
    echo "  prune              Remove unused Docker resources"
    echo "  exec [service]     Execute command in service"
    echo "  bash [service]     Open bash shell in service"
    echo "  status             Check Docker status"
    echo "  help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/docker-setup.sh build"
    echo "  ./scripts/docker-setup.sh start"
    echo "  ./scripts/docker-setup.sh logs app"
    echo "  ./scripts/docker-setup.sh exec app npm test"
    echo "  ./scripts/docker-setup.sh bash app"
}

################################################################################
# Main Execution
################################################################################

main() {
    mkdir -p "${PROJECT_ROOT}/logs"

    case $COMMAND in
        build)
            check_docker
            build_images
            ;;
        start)
            check_docker
            start_containers
            ;;
        stop)
            check_docker
            stop_containers
            ;;
        restart)
            check_docker
            stop_containers
            start_containers
            ;;
        logs)
            check_docker
            show_logs "$@"
            ;;
        clean)
            check_docker
            clean_docker
            ;;
        prune)
            check_docker
            prune_docker
            ;;
        exec)
            check_docker
            exec_command "$@"
            ;;
        bash)
            check_docker
            bash_shell "$@"
            ;;
        status)
            check_docker
            check_status
            ;;
        help)
            print_help
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            print_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
