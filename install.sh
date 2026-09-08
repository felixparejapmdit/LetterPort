#!/usr/bin/env bash
# ==============================================================================
# 📬 LetterPort LMS - Zero-Config Plug & Play NAS / Server Installer
# Compatible with: Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Linux & macOS
# ==============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Determine script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

clear
echo -e "${CYAN}================================================================${NC}"
echo -e "${GREEN}    📬 LetterPort Letter Management System (LMS) - Installer    ${NC}"
echo -e "${CYAN}    Zero-Config / Plug-and-Play NAS & Server Deployment        ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

# 1. Check Docker Installation
echo -e "${YELLOW}[1/4] Checking prerequisites...${NC}"
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not installed or not in your PATH.${NC}"
    echo "Please install Docker on your NAS or server first:"
    echo "  - Synology: Install 'Container Manager' from Package Center"
    echo "  - QNAP: Install 'Container Station' from App Center"
    echo "  - Linux: Run 'curl -fsSL https://get.docker.com | sh'"
    exit 1
fi

# Detect Docker Compose command
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}❌ Neither 'docker compose' nor 'docker-compose' was found.${NC}"
    exit 1
fi

echo -e "   ${GREEN}✓${NC} Docker detected: $(docker --version)"
echo -e "   ${GREEN}✓${NC} Compose detected: $($COMPOSE_CMD version)"
echo ""

# 2. Prepare Local Persistent Volumes
echo -e "${YELLOW}[2/4] Setting up plug-and-play relative storage folders...${NC}"
mkdir -p "$SCRIPT_DIR/letterport_data"
mkdir -p "$SCRIPT_DIR/db_data"
mkdir -p "$SCRIPT_DIR/pb_data"

# Ensure write permissions for container processes on NAS/Linux
chmod -R 777 "$SCRIPT_DIR/letterport_data" "$SCRIPT_DIR/db_data" "$SCRIPT_DIR/pb_data" 2>/dev/null || true

echo -e "   ${GREEN}✓${NC} Storage folder:  ./letterport_data (Uploads & Scanned Documents)"
echo -e "   ${GREEN}✓${NC} Database folder: ./db_data (PostgreSQL Database)"
echo -e "   ${GREEN}✓${NC} PocketBase data: ./pb_data"
echo ""

# 3. Build and Launch Containers
echo -e "${YELLOW}[3/4] Building and launching LetterPort containers...${NC}"
$COMPOSE_CMD up -d --build

echo ""
echo -e "${YELLOW}[4/4] Detecting server IP address...${NC}"

# Detect primary host IP
HOST_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$HOST_IP" ]; then
    HOST_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}')
fi
if [ -z "$HOST_IP" ]; then
    HOST_IP="localhost"
fi

echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}  🎉 LetterPort LMS Successfully Deployed!                      ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo ""
echo -e "  You can access the system from any device on your network:"
echo ""
echo -e "  🌐 ${CYAN}LetterPort Web Portal:${NC}    ${GREEN}http://${HOST_IP}:8765${NC}"
echo -e "  ⚙️  ${CYAN}System Settings:${NC}          ${GREEN}http://${HOST_IP}:8765/settings${NC}"
echo -e "  🔍 ${CYAN}Live Search:${NC}              ${GREEN}http://${HOST_IP}:8765/search${NC}"
echo -e "  📡 ${CYAN}Backend REST API:${NC}         ${GREEN}http://${HOST_IP}:8765/api${NC}"
echo -e "  🔐 ${CYAN}Default Accounts:${NC}"
echo -e "     - ${YELLOW}Administrator:${NC} username: ${GREEN}admin${NC} | password: ${GREEN}password${NC} (Full access)"
echo -e "     - ${YELLOW}Staff User:${NC}    username: ${GREEN}user${NC}  | password: ${GREEN}password${NC} (Standard access)"
echo ""
echo -e "${YELLOW}Helpful Management Commands:${NC}"
echo -e "  - View live logs:    ${CYAN}${COMPOSE_CMD} logs -f${NC}"
echo -e "  - Stop system:       ${CYAN}${COMPOSE_CMD} down${NC}"
echo -e "  - Restart system:    ${CYAN}${COMPOSE_CMD} restart${NC}"
echo -e "  - Update/Rebuild:    ${CYAN}./install.sh${NC}"
echo -e "${GREEN}================================================================${NC}"
echo ""
