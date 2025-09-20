#!/bin/bash
# Multi-Region Deployment Script for WinTrades Global Trading Platform
# Usage: ./deploy-global.sh [environment] [region]

set -e

# Configuration
ENVIRONMENT=${1:-production}
REGION=${2:-all}
PROJECT_NAME="wintradesgo"
DOCKER_REGISTRY="wintradesgo-registry.com"
VERSION=$(date +%Y%m%d-%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check Docker Swarm
    if ! docker info | grep -q "Swarm: active"; then
        warning "Docker Swarm is not active. Initializing..."
        docker swarm init --advertise-addr $(hostname -I | awk '{print $1}')
    fi
    
    # Check required files
    local required_files=(
        "docker-compose.global.yml"
        "deployment/haproxy/haproxy.cfg"
        "deployment/mysql/master.cnf"
        "deployment/mysql/slave.cnf"
        "deployment/redis/redis.conf"
        "deployment/varnish/default.vcl"
        "deployment/prometheus/prometheus.yml"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            error "Required file not found: $file"
        fi
    done
    
    log "Prerequisites check completed"
}

# Initialize Docker Swarm cluster
init_swarm_cluster() {
    log "Initializing Docker Swarm cluster..."
    
    # Create overlay networks
    docker network create --driver overlay --attachable ${PROJECT_NAME}_global || true
    docker network create --driver overlay --internal ${PROJECT_NAME}_internal || true
    
    # Create secrets
    echo "WinTrades2024!" | docker secret create mysql_root_password - || true
    
    # Label nodes for placement constraints
    docker node update --label-add region=us-east $(docker node ls -q --filter role=manager | head -1) || true
    docker node update --label-add region=eu-west $(docker node ls -q --filter role=worker | head -1) || true
    docker node update --label-add region=asia-pacific $(docker node ls -q --filter role=worker | tail -1) || true
    docker node update --label-add database=master $(docker node ls -q --filter role=manager | head -1) || true
    
    log "Docker Swarm cluster initialized"
}

# Build and push images
build_and_push_images() {
    log "Building and pushing Docker images..."
    
    # Build main application image
    docker build -t ${DOCKER_REGISTRY}/${PROJECT_NAME}:${VERSION} .
    docker tag ${DOCKER_REGISTRY}/${PROJECT_NAME}:${VERSION} ${DOCKER_REGISTRY}/${PROJECT_NAME}:latest
    
    # Push to registry (if registry is configured)
    if docker info | grep -q "Registry:"; then
        docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}:${VERSION}
        docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}:latest
    fi
    
    log "Images built and pushed"
}

# Deploy infrastructure
deploy_infrastructure() {
    log "Deploying global infrastructure..."
    
    # Deploy the stack
    docker stack deploy -c docker-compose.global.yml ${PROJECT_NAME}
    
    # Wait for services to be ready
    log "Waiting for services to start..."
    sleep 30
    
    # Check service status
    docker stack services ${PROJECT_NAME}
    
    log "Infrastructure deployed"
}

# Configure MySQL replication
configure_mysql_replication() {
    log "Configuring MySQL master-slave replication..."
    
    # Wait for MySQL master to be ready
    info "Waiting for MySQL master to be ready..."
    sleep 60
    
    # Get master status
    MASTER_STATUS=$(docker exec $(docker ps -q -f name=${PROJECT_NAME}_mysql_master) mysql -uroot -pWinTrades2024! -e "SHOW MASTER STATUS\G")
    MASTER_FILE=$(echo "$MASTER_STATUS" | grep "File:" | awk '{print $2}')
    MASTER_POSITION=$(echo "$MASTER_STATUS" | grep "Position:" | awk '{print $2}')
    
    info "Master file: $MASTER_FILE, Position: $MASTER_POSITION"
    
    # Configure slaves
    local slaves=("mysql_slave_us" "mysql_slave_eu" "mysql_slave_ap")
    local server_ids=(2 3 4)
    
    for i in "${!slaves[@]}"; do
        local slave="${slaves[$i]}"
        local server_id="${server_ids[$i]}"
        
        info "Configuring slave: $slave with server-id: $server_id"
        
        # Wait for slave to be ready
        sleep 30
        
        # Configure replication
        docker exec $(docker ps -q -f name=${PROJECT_NAME}_${slave}) mysql -uroot -pWinTrades2024! -e "
            CHANGE MASTER TO 
            MASTER_HOST='mysql_master',
            MASTER_USER='replication',
            MASTER_PASSWORD='WinTrades2024!',
            MASTER_LOG_FILE='$MASTER_FILE',
            MASTER_LOG_POS=$MASTER_POSITION;
            START SLAVE;
        " || warning "Failed to configure slave: $slave"
    done
    
    log "MySQL replication configured"
}

# Configure Redis cluster
configure_redis_cluster() {
    log "Configuring Redis cluster..."
    
    # Wait for Redis nodes to be ready
    sleep 60
    
    # Get Redis container IPs
    local redis_ips=()
    for container in $(docker ps -q -f name=${PROJECT_NAME}_redis_cluster); do
        local ip=$(docker inspect $container | jq -r '.[0].NetworkSettings.Networks | to_entries[0].value.IPAddress')
        redis_ips+=("$ip:6379")
    done
    
    # Create cluster
    if [[ ${#redis_ips[@]} -ge 6 ]]; then
        docker exec $(docker ps -q -f name=${PROJECT_NAME}_redis_cluster | head -1) redis-cli --cluster create ${redis_ips[@]} --cluster-replicas 1 --cluster-yes || warning "Redis cluster creation failed"
    else
        warning "Not enough Redis nodes for cluster (need at least 6)"
    fi
    
    log "Redis cluster configured"
}

# Setup SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Create self-signed certificates for development
    mkdir -p deployment/ssl
    
    if [[ ! -f deployment/ssl/wintradesgo.pem ]]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout deployment/ssl/wintradesgo.key \
            -out deployment/ssl/wintradesgo.crt \
            -subj "/C=US/ST=NY/L=NYC/O=WinTrades/CN=wintradesgo.com" \
            -config <(
                echo '[dn]'
                echo 'CN=wintradesgo.com'
                echo '[req]'
                echo 'distinguished_name = dn'
                echo '[EXT]'
                echo 'subjectAltName=DNS:wintradesgo.com,DNS:*.wintradesgo.com'
                echo 'keyUsage=keyEncipherment,dataEncipherment'
                echo 'extendedKeyUsage=serverAuth'
            ) -extensions EXT
        
        # Combine certificate and key for HAProxy
        cat deployment/ssl/wintradesgo.crt deployment/ssl/wintradesgo.key > deployment/ssl/wintradesgo.pem
    fi
    
    log "SSL certificates configured"
}

# Health checks
run_health_checks() {
    log "Running health checks..."
    
    local services=(
        "global_loadbalancer:8080/stats"
        "prometheus:9090/-/healthy"
        "grafana:3000/api/health"
    )
    
    for service in "${services[@]}"; do
        local url="http://${service}"
        info "Checking: $url"
        
        if curl -f -s "$url" > /dev/null; then
            log "✓ $service is healthy"
        else
            warning "✗ $service health check failed"
        fi
    done
    
    # Check application endpoints
    local regions=("us-east" "eu-west" "asia-pacific")
    for region in "${regions[@]}"; do
        info "Checking application health in region: $region"
        # Add region-specific health checks here
    done
    
    log "Health checks completed"
}

# Display deployment information
show_deployment_info() {
    log "Deployment Information"
    echo "======================="
    echo "Environment: $ENVIRONMENT"
    echo "Version: $VERSION"
    echo "Timestamp: $(date)"
    echo ""
    echo "Service URLs:"
    echo "- Load Balancer Stats: http://localhost:8080/stats"
    echo "- Prometheus: http://localhost:9090"
    echo "- Grafana: http://localhost:3000 (admin/WinTrades2024!)"
    echo "- Kibana: http://localhost:5601"
    echo "- Application: https://localhost"
    echo ""
    echo "Docker Stack Services:"
    docker stack services ${PROJECT_NAME}
    echo ""
    echo "To scale services:"
    echo "docker service scale ${PROJECT_NAME}_app_us_east=5"
    echo ""
    echo "To update services:"
    echo "docker service update --image ${DOCKER_REGISTRY}/${PROJECT_NAME}:new-version ${PROJECT_NAME}_app_us_east"
    echo ""
    echo "To remove stack:"
    echo "docker stack rm ${PROJECT_NAME}"
}

# Cleanup function
cleanup() {
    if [[ "${CLEANUP_ON_EXIT:-false}" == "true" ]]; then
        log "Cleaning up..."
        docker stack rm ${PROJECT_NAME} || true
        docker network rm ${PROJECT_NAME}_global ${PROJECT_NAME}_internal || true
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Main deployment flow
main() {
    log "Starting WinTrades Global Deployment"
    
    check_prerequisites
    setup_ssl
    init_swarm_cluster
    build_and_push_images
    deploy_infrastructure
    configure_mysql_replication
    configure_redis_cluster
    run_health_checks
    show_deployment_info
    
    log "Global deployment completed successfully!"
}

# Run main function
main "$@"