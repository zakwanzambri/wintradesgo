# Multi-Region Deployment Script for WinTrades Global Trading Platform
# PowerShell version for Windows
# Usage: .\deploy-global.ps1 [-Environment production] [-Region all]

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "production",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "all"
)

# Configuration
$ProjectName = "wintradesgo"
$DockerRegistry = "wintradesgo-registry.com"
$Version = Get-Date -Format "yyyyMMdd-HHmmss"

# Logging functions
function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor Green
}

function Write-Error-Log {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}

function Write-Warning-Log {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Info-Log {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error-Log "Docker is not installed or not in PATH"
    }
    
    # Check Docker Compose
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error-Log "Docker Compose is not installed or not in PATH"
    }
    
    # Check Docker Swarm
    $swarmInfo = docker info --format "{{.Swarm.LocalNodeState}}"
    if ($swarmInfo -ne "active") {
        Write-Warning-Log "Docker Swarm is not active. Initializing..."
        $hostIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" | Select-Object -First 1).IPAddress
        docker swarm init --advertise-addr $hostIP
    }
    
    # Check required files
    $requiredFiles = @(
        "docker-compose.global.yml",
        "deployment\haproxy\haproxy.cfg",
        "deployment\mysql\master.cnf",
        "deployment\mysql\slave.cnf",
        "deployment\redis\redis.conf",
        "deployment\varnish\default.vcl",
        "deployment\prometheus\prometheus.yml"
    )
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-Error-Log "Required file not found: $file"
        }
    }
    
    Write-Log "Prerequisites check completed"
}

# Initialize Docker Swarm cluster
function Initialize-SwarmCluster {
    Write-Log "Initializing Docker Swarm cluster..."
    
    # Create overlay networks
    try {
        docker network create --driver overlay --attachable "${ProjectName}_global"
    } catch {
        Write-Info-Log "Network ${ProjectName}_global already exists"
    }
    
    try {
        docker network create --driver overlay --internal "${ProjectName}_internal"
    } catch {
        Write-Info-Log "Network ${ProjectName}_internal already exists"
    }
    
    # Create secrets
    try {
        "WinTrades2024!" | docker secret create mysql_root_password -
    } catch {
        Write-Info-Log "Secret mysql_root_password already exists"
    }
    
    # Label nodes for placement constraints
    $managerNode = (docker node ls --filter role=manager --format "{{.ID}}" | Select-Object -First 1)
    $workerNodes = docker node ls --filter role=worker --format "{{.ID}}"
    
    docker node update --label-add region=us-east $managerNode
    docker node update --label-add database=master $managerNode
    
    if ($workerNodes.Count -ge 1) {
        docker node update --label-add region=eu-west $workerNodes[0]
    }
    if ($workerNodes.Count -ge 2) {
        docker node update --label-add region=asia-pacific $workerNodes[1]
    }
    
    Write-Log "Docker Swarm cluster initialized"
}

# Build and push images
function Build-AndPushImages {
    Write-Log "Building and pushing Docker images..."
    
    # Build main application image
    docker build -t "${DockerRegistry}/${ProjectName}:${Version}" .
    docker tag "${DockerRegistry}/${ProjectName}:${Version}" "${DockerRegistry}/${ProjectName}:latest"
    
    # Push to registry (if registry is configured)
    $registryInfo = docker info --format "{{.RegistryConfig}}"
    if ($registryInfo) {
        docker push "${DockerRegistry}/${ProjectName}:${Version}"
        docker push "${DockerRegistry}/${ProjectName}:latest"
    }
    
    Write-Log "Images built and pushed"
}

# Deploy infrastructure
function Deploy-Infrastructure {
    Write-Log "Deploying global infrastructure..."
    
    # Deploy the stack
    docker stack deploy -c docker-compose.global.yml $ProjectName
    
    # Wait for services to be ready
    Write-Log "Waiting for services to start..."
    Start-Sleep -Seconds 30
    
    # Check service status
    docker stack services $ProjectName
    
    Write-Log "Infrastructure deployed"
}

# Configure MySQL replication
function Configure-MySQLReplication {
    Write-Log "Configuring MySQL master-slave replication..."
    
    # Wait for MySQL master to be ready
    Write-Info-Log "Waiting for MySQL master to be ready..."
    Start-Sleep -Seconds 60
    
    # Get master status
    $masterContainer = docker ps -q -f "name=${ProjectName}_mysql_master"
    $masterStatus = docker exec $masterContainer mysql -uroot -pWinTrades2024! -e "SHOW MASTER STATUS\G"
    
    $masterFile = ($masterStatus | Select-String "File:").ToString().Split()[1]
    $masterPosition = ($masterStatus | Select-String "Position:").ToString().Split()[1]
    
    Write-Info-Log "Master file: $masterFile, Position: $masterPosition"
    
    # Configure slaves
    $slaves = @("mysql_slave_us", "mysql_slave_eu", "mysql_slave_ap")
    $serverIds = @(2, 3, 4)
    
    for ($i = 0; $i -lt $slaves.Count; $i++) {
        $slave = $slaves[$i]
        $serverId = $serverIds[$i]
        
        Write-Info-Log "Configuring slave: $slave with server-id: $serverId"
        
        # Wait for slave to be ready
        Start-Sleep -Seconds 30
        
        # Configure replication
        $slaveContainer = docker ps -q -f "name=${ProjectName}_${slave}"
        try {
            docker exec $slaveContainer mysql -uroot -pWinTrades2024! -e @"
                CHANGE MASTER TO 
                MASTER_HOST='mysql_master',
                MASTER_USER='replication',
                MASTER_PASSWORD='WinTrades2024!',
                MASTER_LOG_FILE='$masterFile',
                MASTER_LOG_POS=$masterPosition;
                START SLAVE;
"@
        } catch {
            Write-Warning-Log "Failed to configure slave: $slave"
        }
    }
    
    Write-Log "MySQL replication configured"
}

# Configure Redis cluster
function Configure-RedisCluster {
    Write-Log "Configuring Redis cluster..."
    
    # Wait for Redis nodes to be ready
    Start-Sleep -Seconds 60
    
    # Get Redis container IPs
    $redisContainers = docker ps -q -f "name=${ProjectName}_redis_cluster"
    $redisIps = @()
    
    foreach ($container in $redisContainers) {
        $inspectResult = docker inspect $container | ConvertFrom-Json
        $ip = $inspectResult[0].NetworkSettings.Networks.PSObject.Properties.Value[0].IPAddress
        $redisIps += "${ip}:6379"
    }
    
    # Create cluster
    if ($redisIps.Count -ge 6) {
        $firstContainer = $redisContainers[0]
        try {
            docker exec $firstContainer redis-cli --cluster create $($redisIps -join ' ') --cluster-replicas 1 --cluster-yes
        } catch {
            Write-Warning-Log "Redis cluster creation failed"
        }
    } else {
        Write-Warning-Log "Not enough Redis nodes for cluster (need at least 6)"
    }
    
    Write-Log "Redis cluster configured"
}

# Setup SSL certificates
function Set-SSL {
    Write-Log "Setting up SSL certificates..."
    
    # Create SSL directory
    if (-not (Test-Path "deployment\ssl")) {
        New-Item -ItemType Directory -Path "deployment\ssl" -Force
    }
    
    # Create self-signed certificates for development
    if (-not (Test-Path "deployment\ssl\wintradesgo.pem")) {
        # Use OpenSSL if available, otherwise create placeholder
        if (Get-Command openssl -ErrorAction SilentlyContinue) {
            $configContent = @"
[dn]
CN=wintradesgo.com
[req]
distinguished_name = dn
[EXT]
subjectAltName=DNS:wintradesgo.com,DNS:*.wintradesgo.com
keyUsage=keyEncipherment,dataEncipherment
extendedKeyUsage=serverAuth
"@
            $configContent | Out-File -FilePath "deployment\ssl\openssl.conf" -Encoding ASCII
            
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
                -keyout "deployment\ssl\wintradesgo.key" `
                -out "deployment\ssl\wintradesgo.crt" `
                -subj "/C=US/ST=NY/L=NYC/O=WinTrades/CN=wintradesgo.com" `
                -config "deployment\ssl\openssl.conf" `
                -extensions EXT
            
            # Combine certificate and key for HAProxy
            Get-Content "deployment\ssl\wintradesgo.crt", "deployment\ssl\wintradesgo.key" | Set-Content "deployment\ssl\wintradesgo.pem"
        } else {
            Write-Warning-Log "OpenSSL not found. Please install OpenSSL or provide SSL certificates manually."
        }
    }
    
    Write-Log "SSL certificates configured"
}

# Health checks
function Test-HealthChecks {
    Write-Log "Running health checks..."
    
    $services = @(
        @{Name="Load Balancer"; URL="http://localhost:8080/stats"},
        @{Name="Prometheus"; URL="http://localhost:9090/-/healthy"},
        @{Name="Grafana"; URL="http://localhost:3000/api/health"}
    )
    
    foreach ($service in $services) {
        Write-Info-Log "Checking: $($service.Name) - $($service.URL)"
        
        try {
            $response = Invoke-WebRequest -Uri $service.URL -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Log "✓ $($service.Name) is healthy"
            } else {
                Write-Warning-Log "✗ $($service.Name) health check failed"
            }
        } catch {
            Write-Warning-Log "✗ $($service.Name) health check failed: $($_.Exception.Message)"
        }
    }
    
    Write-Log "Health checks completed"
}

# Display deployment information
function Show-DeploymentInfo {
    Write-Log "Deployment Information"
    Write-Host "======================="
    Write-Host "Environment: $Environment"
    Write-Host "Version: $Version"
    Write-Host "Timestamp: $(Get-Date)"
    Write-Host ""
    Write-Host "Service URLs:"
    Write-Host "- Load Balancer Stats: http://localhost:8080/stats"
    Write-Host "- Prometheus: http://localhost:9090"
    Write-Host "- Grafana: http://localhost:3000 (admin/WinTrades2024!)"
    Write-Host "- Kibana: http://localhost:5601"
    Write-Host "- Application: https://localhost"
    Write-Host ""
    Write-Host "Docker Stack Services:"
    docker stack services $ProjectName
    Write-Host ""
    Write-Host "To scale services:"
    Write-Host "docker service scale ${ProjectName}_app_us_east=5"
    Write-Host ""
    Write-Host "To update services:"
    Write-Host "docker service update --image ${DockerRegistry}/${ProjectName}:new-version ${ProjectName}_app_us_east"
    Write-Host ""
    Write-Host "To remove stack:"
    Write-Host "docker stack rm $ProjectName"
}

# Main deployment flow
function Start-GlobalDeployment {
    Write-Log "Starting WinTrades Global Deployment"
    
    try {
        Test-Prerequisites
        Set-SSL
        Initialize-SwarmCluster
        Build-AndPushImages
        Deploy-Infrastructure
        Configure-MySQLReplication
        Configure-RedisCluster
        Test-HealthChecks
        Show-DeploymentInfo
        
        Write-Log "Global deployment completed successfully!"
    } catch {
        Write-Error-Log "Deployment failed: $($_.Exception.Message)"
    }
}

# Run main function
Start-GlobalDeployment