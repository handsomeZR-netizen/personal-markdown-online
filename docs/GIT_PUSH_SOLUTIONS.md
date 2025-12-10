# Git Push 失败解决方案

## 问题
```
fatal: unable to access 'https://github.com/...': Failed to connect to github.com port 443
```

## 解决方案

### 方案 1: 检查并配置代理（推荐）

如果你使用了代理（如 Clash、V2Ray 等）：

```bash
# 查看当前代理配置
git config --global http.proxy
git config --global https.proxy

# 设置代理（替换为你的代理地址和端口）
git config --global http.proxy http://127.0.0.1:7897
git config --global https.proxy http://127.0.0.1:7897

# 或者只为 GitHub 设置代理
git config --global http.https://github.com.proxy http://127.0.0.1:7897

# 然后重试推送
git push origin main
```

### 方案 2: 取消代理

如果不需要代理：

```bash
# 取消代理设置
git config --global --unset http.proxy
git config --global --unset https.proxy

# 重试推送
git push origin main
```

### 方案 3: 使用 SSH 而不是 HTTPS

```bash
# 1. 检查是否有 SSH 密钥
ls ~/.ssh

# 2. 如果没有，生成 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 3. 复制公钥内容
cat ~/.ssh/id_ed25519.pub

# 4. 添加到 GitHub
# 访问 https://github.com/settings/keys
# 点击 "New SSH key"，粘贴公钥

# 5. 修改远程仓库地址为 SSH
git remote set-url origin git@github.com:handsomeZR-netizen/personal-markdown-online.git

# 6. 推送
git push origin main
```

### 方案 4: 修改 hosts 文件（中国大陆用户）

```bash
# Windows: C:\Windows\System32\drivers\etc\hosts
# 添加以下内容（使用最新的 GitHub IP）

140.82.113.4 github.com
140.82.114.9 nodeload.github.com
140.82.112.5 api.github.com
140.82.112.10 codeload.github.com
185.199.108.133 raw.githubusercontent.com
185.199.108.153 training.github.com
185.199.108.153 assets-cdn.github.com
185.199.108.153 documentcloud.github.com
140.82.114.17 help.github.com
```

### 方案 5: 使用 GitHub Desktop

如果命令行一直失败，可以使用 GitHub Desktop：

1. 下载安装 [GitHub Desktop](https://desktop.github.com/)
2. 登录你的 GitHub 账号
3. 添加本地仓库
4. 点击 "Push origin" 按钮

### 方案 6: 检查网络连接

```bash
# 测试是否能连接到 GitHub
ping github.com

# 测试 HTTPS 连接
curl -I https://github.com

# 如果都失败，可能是网络问题，需要：
# 1. 检查防火墙设置
# 2. 检查代理软件是否正常运行
# 3. 尝试切换网络（如使用手机热点）
```

## 当前状态

你的代码已经提交到本地仓库：
```
commit 6457cc7
feat: 完成离线功能和 AI 增强功能实现
```

只需要推送到远程仓库即可。

## 推荐步骤

1. **首先尝试方案 1**（配置正确的代理）
2. 如果失败，尝试**方案 3**（使用 SSH）
3. 如果还是失败，使用**方案 5**（GitHub Desktop）

## 验证推送成功

推送成功后，访问你的 GitHub 仓库查看：
https://github.com/handsomeZR-netizen/personal-markdown-online

应该能看到最新的提交记录。

## 需要帮助？

如果以上方案都不行，可以：
1. 检查代理软件是否正常运行
2. 尝试使用手机热点
3. 联系网络管理员检查防火墙设置
