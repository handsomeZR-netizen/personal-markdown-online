#!/bin/bash

# Vercel 环境变量一键配置脚本
# 使用方法: bash vercel-env-setup.sh

echo "🚀 Vercel 环境变量配置助手"
echo "================================"
echo ""

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ 未检测到 Vercel CLI"
    echo "请先安装: npm install -g vercel"
    echo "或手动在 Vercel Dashboard 配置环境变量"
    exit 1
fi

echo "✅ 检测到 Vercel CLI"
echo ""

# 检查是否已登录
if ! vercel whoami &> /dev/null; then
    echo "请先登录 Vercel:"
    vercel login
fi

echo "📋 开始配置环境变量..."
echo ""

# 从 .env.local 读取环境变量
if [ ! -f .env.local ]; then
    echo "❌ 未找到 .env.local 文件"
    echo "请先创建 .env.local 文件并配置环境变量"
    exit 1
fi

# 读取并设置环境变量
while IFS='=' read -r key value; do
    # 跳过注释和空行
    if [[ $key =~ ^#.*$ ]] || [[ -z $key ]]; then
        continue
    fi
    
    # 移除引号
    value=$(echo $value | sed 's/^["'\'']//' | sed 's/["'\'']$//')
    
    # 设置环境变量到 Vercel（所有环境）
    echo "⚙️  设置 $key..."
    vercel env add $key production preview development <<< "$value" 2>/dev/null || \
    vercel env rm $key production preview development -y 2>/dev/null && \
    vercel env add $key production preview development <<< "$value"
    
done < .env.local

echo ""
echo "✅ 环境变量配置完成！"
echo ""
echo "📝 下一步:"
echo "1. 运行 'vercel' 或 'git push' 触发重新部署"
echo "2. 等待部署完成（约 2-3 分钟）"
echo "3. 访问你的网站验证"
echo ""
echo "💡 提示: 你也可以在 Vercel Dashboard 手动验证环境变量"
echo "   https://vercel.com/dashboard → 项目 → Settings → Environment Variables"
