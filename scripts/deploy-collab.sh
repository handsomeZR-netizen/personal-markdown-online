#!/bin/bash
# deploy-collab.sh - 协作服务部署脚本 (Linux/macOS)
# 使用方法: ./scripts/deploy-collab.sh fly|render|docker

set -e

PLATFORM=$1
DATABASE_URL=$2
COLLAB_SECRET=$3
ALLOWED_ORIGINS=${4:-"https://xzr5.top"}

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================"
echo "  协作服务部署脚本"
echo "  平台: $PLATFORM"
echo -e "========================================${NC}"

# 检查参数
if [ -z "$PLATFORM" ]; then
    echo -e "${RED}用法: $0 <fly|render|docker> [DATABASE_URL] [COLLAB_SECRET] [ALLOWED_ORIGINS]${NC}"
    exit 1
fi

# 生成密钥（如果未提供）
if [ -z "$COLLAB_SECRET" ]; then
    COLLAB_SECRET=$(openssl rand -base64 32)
    echo -e "\n${YELLOW}生成的 COLLAB_SERVER_SECRET:${NC}"
    echo -e "${GREEN}$COLLAB_SECRET${NC}"
    echo -e "${YELLOW}请保存此密钥，并在 Vercel 中设置相同的值！${NC}\n"
fi

case $PLATFORM in
    fly)
        echo -e "\n${CYAN}[Fly.io 部署]${NC}"
        
        # 检查 fly CLI
        if ! command -v fly &> /dev/null; then
            echo -e "${YELLOW}安装 Fly CLI...${NC}"
            curl -L https://fly.io/install.sh | sh
        fi
        
        # 登录检查
        echo -e "${YELLOW}检查 Fly.io 登录状态...${NC}"
        if ! fly auth whoami &> /dev/null; then
            echo -e "${YELLOW}请先登录 Fly.io...${NC}"
            fly auth login
        fi
        
        # 创建应用（如果不存在）
        echo -e "${YELLOW}创建/检查应用...${NC}"
        fly apps create noteapp-collab 2>/dev/null || true
        
        # 设置 secrets
        if [ -n "$DATABASE_URL" ]; then
            echo -e "${YELLOW}设置环境变量...${NC}"
            fly secrets set \
                DATABASE_URL="$DATABASE_URL" \
                COLLAB_SERVER_SECRET="$COLLAB_SECRET" \
                COLLAB_ALLOWED_ORIGINS="$ALLOWED_ORIGINS"
        else
            echo -e "${YELLOW}警告: 未提供 DATABASE_URL，请手动设置:${NC}"
            echo 'fly secrets set DATABASE_URL="your-neon-url"'
        fi
        
        # 部署
        echo -e "${YELLOW}开始部署...${NC}"
        fly deploy --dockerfile Dockerfile.collab
        
        # 显示状态
        echo -e "\n${GREEN}部署完成！${NC}"
        fly status
        
        echo -e "\n${CYAN}下一步:${NC}"
        echo "1. 添加自定义域名: fly certs add collab.xzr5.top"
        echo "2. 配置 DNS CNAME: collab -> noteapp-collab.fly.dev"
        echo "3. 在 Vercel 设置 NEXT_PUBLIC_COLLAB_SERVER_URL=wss://collab.xzr5.top"
        ;;
        
    render)
        echo -e "\n${CYAN}[Render 部署]${NC}"
        echo -e "${YELLOW}Render 需要通过 Web Dashboard 部署:${NC}"
        echo ""
        echo "1. 访问 https://dashboard.render.com"
        echo "2. New -> Web Service -> 连接 GitHub 仓库"
        echo "3. 选择 Docker 环境"
        echo "4. Dockerfile Path: ./Dockerfile.collab"
        echo "5. 设置环境变量:"
        echo "   DATABASE_URL = $DATABASE_URL"
        echo "   COLLAB_SERVER_SECRET = $COLLAB_SECRET"
        echo "   COLLAB_ALLOWED_ORIGINS = $ALLOWED_ORIGINS"
        echo "6. 部署"
        echo ""
        echo -e "${CYAN}或者使用 render.yaml 自动配置（Blueprint）${NC}"
        ;;
        
    docker)
        echo -e "\n${CYAN}[Docker 自托管部署]${NC}"
        
        # 创建 .env.collab 文件
        if [ -n "$DATABASE_URL" ]; then
            cat > .env.collab << EOF
# 协作服务环境变量
DATABASE_URL=$DATABASE_URL
COLLAB_SERVER_SECRET=$COLLAB_SECRET
COLLAB_ALLOWED_ORIGINS=$ALLOWED_ORIGINS
EOF
            echo -e "${GREEN}已创建 .env.collab 文件${NC}"
        else
            echo -e "${YELLOW}请创建 .env.collab 文件，参考 .env.collab.example${NC}"
        fi
        
        # 构建并启动
        echo -e "${YELLOW}构建 Docker 镜像...${NC}"
        docker-compose -f docker-compose.collab.yml build
        
        echo -e "${YELLOW}启动服务...${NC}"
        docker-compose -f docker-compose.collab.yml up -d
        
        echo -e "\n${CYAN}服务状态:${NC}"
        docker-compose -f docker-compose.collab.yml ps
        
        echo -e "\n${CYAN}下一步:${NC}"
        echo "1. 确保 Caddyfile 中的域名正确"
        echo "2. 配置 DNS A 记录指向服务器 IP"
        echo "3. 查看日志: docker-compose -f docker-compose.collab.yml logs -f collab"
        ;;
        
    *)
        echo -e "${RED}未知平台: $PLATFORM${NC}"
        echo "支持的平台: fly, render, docker"
        exit 1
        ;;
esac

echo -e "\n${CYAN}========================================"
echo -e "${YELLOW}  重要提醒${NC}"
echo -e "${CYAN}========================================${NC}"
echo "1. 在 Vercel 设置以下环境变量:"
echo "   NEXT_PUBLIC_COLLAB_SERVER_URL = wss://collab.xzr5.top"
echo "   COLLAB_SERVER_SECRET = $COLLAB_SECRET"
echo ""
echo "2. 重新部署 Vercel 以应用变量:"
echo "   vercel --prod"
