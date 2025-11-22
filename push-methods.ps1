# Git 推送多方法脚本
# 此脚本提供多种推送到 GitHub 的方法

Write-Host "=== Git 推送多方法脚本 ===" -ForegroundColor Cyan
Write-Host ""

# 检查当前状态
Write-Host "检查当前 Git 状态..." -ForegroundColor Yellow
git status
Write-Host ""

# 方法选择
Write-Host "请选择推送方法:" -ForegroundColor Green
Write-Host "1. 直接推送 (git push origin main)"
Write-Host "2. 使用代理推送 (端口 7890)"
Write-Host "3. 使用代理推送 (端口 10809)"
Write-Host "4. 使用代理推送 (端口 1080)"
Write-Host "5. 使用 SSH 推送"
Write-Host "6. 强制推送 (git push -f origin main)"
Write-Host "7. 查看推送帮助"
Write-Host ""

$choice = Read-Host "输入选项 (1-7)"

switch ($choice) {
    "1" {
        Write-Host "尝试直接推送..." -ForegroundColor Yellow
        git push origin main
    }
    "2" {
        Write-Host "配置代理 127.0.0.1:7890..." -ForegroundColor Yellow
        git config --global http.proxy http://127.0.0.1:7890
        git config --global https.proxy http://127.0.0.1:7890
        git push origin main
        git config --global --unset http.proxy
        git config --global --unset https.proxy
    }
    "3" {
        Write-Host "配置代理 127.0.0.1:10809..." -ForegroundColor Yellow
        git config --global http.proxy http://127.0.0.1:10809
        git config --global https.proxy http://127.0.0.1:10809
        git push origin main
        git config --global --unset http.proxy
        git config --global --unset https.proxy
    }
    "4" {
        Write-Host "配置代理 127.0.0.1:1080..." -ForegroundColor Yellow
        git config --global http.proxy http://127.0.0.1:1080
        git config --global https.proxy http://127.0.0.1:1080
        git push origin main
        git config --global --unset http.proxy
        git config --global --unset https.proxy
    }
    "5" {
        Write-Host "切换到 SSH 并推送..." -ForegroundColor Yellow
        git remote set-url origin git@github.com:handsomeZR-netizen/personal-markdown-online.git
        git push origin main
        # 如果失败，切回 HTTPS
        if ($LASTEXITCODE -ne 0) {
            Write-Host "SSH 推送失败，切回 HTTPS" -ForegroundColor Red
            git remote set-url origin https://github.com/handsomeZR-netizen/personal-markdown-online.git
        }
    }
    "6" {
        Write-Host "警告: 强制推送会覆盖远程仓库!" -ForegroundColor Red
        $confirm = Read-Host "确认强制推送? (yes/no)"
        if ($confirm -eq "yes") {
            git push -f origin main
        } else {
            Write-Host "已取消" -ForegroundColor Yellow
        }
    }
    "7" {
        Write-Host @"

=== 推送帮助 ===

如果所有方法都失败，请尝试以下步骤:

1. 检查网络连接
   - 确保可以访问 github.com
   - 尝试在浏览器打开 https://github.com

2. 检查代理设置
   - 如果使用 VPN/代理，确认端口号
   - 常见端口: 7890, 10809, 1080, 10808

3. 使用 GitHub Desktop
   - 下载: https://desktop.github.com
   - 打开项目并推送

4. 手动推送
   在终端运行:
   git push origin main

5. 检查 SSH 配置 (如果使用 SSH)
   - 确保 SSH key 已添加到 GitHub
   - 测试: ssh -T git@github.com

6. 临时解决方案
   - 导出补丁: git format-patch origin/main
   - 在其他设备上应用补丁

当前远程仓库:
"@
        git remote -v
    }
    default {
        Write-Host "无效选项" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "完成!" -ForegroundColor Green
