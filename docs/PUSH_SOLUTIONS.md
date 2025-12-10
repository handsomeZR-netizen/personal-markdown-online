# Git 推送解决方案

## 当前状态
- ✅ 代码已提交: `fix: wrap SearchBar with Suspense to fix useSearchParams error`
- ⏳ 待推送: 5 个提交在本地，需要推送到远程

## 快速推送方法

### 方法 1: 使用 PowerShell 脚本（推荐）
```powershell
cd note-app
.\push-methods.ps1
```
然后选择合适的推送方法。

### 方法 2: 手动命令

#### 2.1 直接推送
```bash
git push origin main
```

#### 2.2 使用代理推送（如果有 VPN）
```bash
# 设置代理（根据你的代理端口修改）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 推送
git push origin main

# 清除代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```

常见代理端口:
- Clash: 7890
- V2Ray: 10809
- Shadowsocks: 1080

#### 2.3 使用 SSH 推送
```bash
# 切换到 SSH
git remote set-url origin git@github.com:handsomeZR-netizen/personal-markdown-online.git

# 推送
git push origin main

# 如果失败，切回 HTTPS
git remote set-url origin https://github.com/handsomeZR-netizen/personal-markdown-online.git
```

### 方法 3: 使用 GitHub Desktop
1. 下载并安装 [GitHub Desktop](https://desktop.github.com)
2. 打开项目: File → Add Local Repository → 选择 `note-app` 文件夹
3. 点击 "Push origin" 按钮

### 方法 4: 使用 VS Code
1. 打开 VS Code 的源代码管理面板 (Ctrl+Shift+G)
2. 点击 "..." 菜单
3. 选择 "Push"

## 故障排除

### 问题 1: 连接超时
```
fatal: unable to access 'https://github.com/...': Failed to connect to github.com port 443
```

**解决方案:**
1. 检查网络连接
2. 使用代理（方法 2.2）
3. 切换到 SSH（方法 2.3）
4. 使用 GitHub Desktop（方法 3）

### 问题 2: SSH 配置错误
```
Bad configuration option: \357\273\277host
```

**解决方案:**
修复 SSH 配置文件的 BOM 字符:
```powershell
# 读取并重新保存 SSH 配置（去除 BOM）
$content = Get-Content -Path "$env:USERPROFILE\.ssh\config" -Raw
[System.IO.File]::WriteAllText("$env:USERPROFILE\.ssh\config", $content, [System.Text.UTF8Encoding]::new($false))
```

### 问题 3: 认证失败
```
fatal: Authentication failed
```

**解决方案:**
1. 使用 GitHub Personal Access Token
2. 或使用 SSH key
3. 或使用 GitHub Desktop

## 推送的提交内容

本次推送包含以下 5 个提交:
1. 离线功能和 AI 增强
2. 搜索栏功能
3. 性能优化
4. 测试覆盖
5. **修复 useSearchParams 错误** ← 最新

## 验证推送成功

推送成功后，访问:
https://github.com/handsomeZR-netizen/personal-markdown-online

应该能看到最新的提交。

## 需要帮助？

如果所有方法都失败:
1. 检查 GitHub 状态: https://www.githubstatus.com
2. 尝试在其他网络环境下推送
3. 导出补丁文件，在其他设备上应用:
   ```bash
   git format-patch origin/main
   ```
