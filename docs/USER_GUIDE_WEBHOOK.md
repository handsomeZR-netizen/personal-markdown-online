# Webhook 集成指南

## 概述

Webhook 允许您将团队协作知识库与其他系统集成，在笔记发生变化时自动通知外部服务。本指南将帮助您配置和使用 Webhook 功能。

## 什么是 Webhook

Webhook 是一种 HTTP 回调机制，当特定事件发生时，系统会向您配置的 URL 发送 POST 请求。

### 工作原理

```
笔记变化 → 触发事件 → 发送 HTTP POST → 您的服务器处理
```

### 使用场景

- **自动备份**：笔记更新时自动备份到外部存储
- **团队通知**：在 Slack/钉钉中通知团队成员
- **工作流自动化**：触发 CI/CD 流程或其他自动化任务
- **数据同步**：同步笔记到其他系统
- **审计日志**：记录所有笔记变更历史
- **内容发布**：自动发布笔记到博客或文档站点

## 配置 Webhook

### 基本配置

1. **进入设置**：
   - 点击右上角头像
   - 选择"设置" → "Webhook"

2. **添加 Webhook**：
   - 点击"添加 Webhook"按钮
   - 输入 Webhook URL
   - 选择要监听的事件
   - 点击"保存"

3. **测试 Webhook**：
   - 点击"测试"按钮
   - 系统会发送测试请求
   - 检查您的服务器是否收到请求

### URL 要求

Webhook URL 必须满足：

- **协议**：必须使用 HTTPS（生产环境）
- **格式**：有效的 URL 格式
- **可访问**：公网可访问（不能是 localhost）
- **响应**：在 5 秒内返回 2xx 状态码

示例 URL：
```
https://your-domain.com/webhooks/notes
https://api.your-service.com/v1/callbacks
```

### 事件类型

可以选择监听以下事件：

| 事件 | 触发时机 | 说明 |
|------|----------|------|
| `note.created` | 创建新笔记 | 笔记首次保存时触发 |
| `note.updated` | 更新笔记 | 笔记内容或元数据修改时触发 |
| `note.deleted` | 删除笔记 | 笔记被删除时触发 |
| `note.shared` | 分享笔记 | 添加协作者或启用公开分享时触发 |
| `note.moved` | 移动笔记 | 笔记移动到其他文件夹时触发 |

## Webhook Payload

### 请求格式

系统会发送 JSON 格式的 POST 请求：

```http
POST /your-webhook-endpoint HTTP/1.1
Host: your-domain.com
Content-Type: application/json
User-Agent: TeamKnowledgeBase/1.0
X-Webhook-Signature: sha256=...
X-Webhook-Event: note.updated
X-Webhook-Delivery: 12345678-1234-1234-1234-123456789012

{
  "event": "note.updated",
  "timestamp": "2024-01-01T12:00:00Z",
  "noteId": "abc123",
  "title": "我的笔记",
  "userId": "user123",
  "userName": "张三",
  "userEmail": "zhangsan@example.com",
  "folderId": "folder123",
  "folderPath": "/工作/项目",
  "changes": {
    "title": false,
    "content": true,
    "tags": false
  }
}
```

### Payload 字段说明

#### 通用字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `event` | string | 事件类型 |
| `timestamp` | string | ISO 8601 格式的时间戳 |
| `noteId` | string | 笔记 ID |
| `title` | string | 笔记标题 |
| `userId` | string | 操作用户 ID |
| `userName` | string | 操作用户名称 |
| `userEmail` | string | 操作用户邮箱 |

#### note.created 特有字段

```json
{
  "event": "note.created",
  "content": "笔记内容（可选）",
  "tags": ["标签1", "标签2"],
  "categoryId": "category123",
  "folderId": "folder123"
}
```

#### note.updated 特有字段

```json
{
  "event": "note.updated",
  "changes": {
    "title": true,      // 标题是否修改
    "content": true,    // 内容是否修改
    "tags": false,      // 标签是否修改
    "category": false,  // 分类是否修改
    "folder": false     // 文件夹是否修改
  },
  "previousTitle": "旧标题"  // 如果标题修改
}
```

#### note.deleted 特有字段

```json
{
  "event": "note.deleted",
  "deletedAt": "2024-01-01T12:00:00Z",
  "reason": "user_action"  // 删除原因
}
```

#### note.shared 特有字段

```json
{
  "event": "note.shared",
  "shareType": "collaborator",  // 或 "public"
  "collaboratorEmail": "user@example.com",  // 如果是添加协作者
  "collaboratorRole": "editor",  // 或 "viewer"
  "publicSlug": "abc123"  // 如果是公开分享
}
```

### HTTP 请求头

| 请求头 | 说明 |
|--------|------|
| `Content-Type` | 始终为 `application/json` |
| `User-Agent` | `TeamKnowledgeBase/1.0` |
| `X-Webhook-Event` | 事件类型 |
| `X-Webhook-Delivery` | 唯一的投递 ID（UUID） |
| `X-Webhook-Signature` | HMAC-SHA256 签名（如果配置了密钥） |

## 安全性

### 签名验证

为了确保 Webhook 请求来自合法来源，建议启用签名验证：

1. **配置密钥**：
   - 在 Webhook 设置中输入密钥
   - 密钥至少 32 个字符
   - 妥善保管密钥

2. **验证签名**：
   - 系统会在 `X-Webhook-Signature` 头中发送签名
   - 格式：`sha256=<HMAC-SHA256>`

#### 验证示例（Node.js）

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = 'sha256=' + 
    crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// 使用示例
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  // 处理 Webhook
  console.log('Received event:', req.body.event);
  res.status(200).send('OK');
});
```

#### 验证示例（Python）

```python
import hmac
import hashlib

def verify_webhook_signature(payload, signature, secret):
    expected_signature = 'sha256=' + hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

# 使用示例
@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    secret = os.environ.get('WEBHOOK_SECRET')
    payload = request.get_data(as_text=True)
    
    if not verify_webhook_signature(payload, signature, secret):
        return 'Invalid signature', 401
    
    # 处理 Webhook
    data = request.json
    print(f"Received event: {data['event']}")
    return 'OK', 200
```

### IP 白名单

如果需要额外的安全保护，可以配置 IP 白名单：

1. 在设置中启用"IP 白名单"
2. 添加允许的 IP 地址或 CIDR 范围
3. 系统只会向白名单中的 IP 发送请求

## 重试机制

### 自动重试

如果 Webhook 投递失败，系统会自动重试：

- **重试次数**：最多 3 次
- **重试间隔**：5 秒、10 秒、20 秒（指数退避）
- **失败条件**：
  - HTTP 状态码非 2xx
  - 连接超时（5 秒）
  - 网络错误

### 重试日志

在 Webhook 设置中可以查看重试日志：

```
投递 ID: 12345678-1234-1234-1234-123456789012
事件: note.updated
时间: 2024-01-01 12:00:00
状态: 失败（3 次重试后）
错误: Connection timeout
```

### 手动重试

对于失败的投递，可以手动重试：

1. 在 Webhook 日志中找到失败的投递
2. 点击"重试"按钮
3. 系统会立即重新发送请求

## 实际应用示例

### 1. Slack 通知

当笔记更新时发送 Slack 消息：

```javascript
// Slack Webhook 端点
app.post('/webhook/slack', async (req, res) => {
  const { event, title, userName } = req.body;
  
  if (event === 'note.updated') {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `📝 ${userName} 更新了笔记《${title}》`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${userName}* 更新了笔记 *${title}*`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: '查看笔记' },
                url: `https://your-app.com/notes/${req.body.noteId}`
              }
            ]
          }
        ]
      })
    });
  }
  
  res.status(200).send('OK');
});
```

### 2. 自动备份到 GitHub

笔记更新时自动提交到 GitHub：

```javascript
const { Octokit } = require('@octokit/rest');

app.post('/webhook/github-backup', async (req, res) => {
  const { event, noteId, title, content } = req.body;
  
  if (event === 'note.updated' || event === 'note.created') {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    
    // 获取笔记内容
    const noteContent = await fetchNoteContent(noteId);
    
    // 提交到 GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: 'your-username',
      repo: 'notes-backup',
      path: `notes/${noteId}.md`,
      message: `Update: ${title}`,
      content: Buffer.from(noteContent).toString('base64'),
      branch: 'main'
    });
  }
  
  res.status(200).send('OK');
});
```

### 3. 发送邮件通知

协作者修改笔记时发送邮件：

```javascript
const nodemailer = require('nodemailer');

app.post('/webhook/email', async (req, res) => {
  const { event, title, userName, noteId } = req.body;
  
  if (event === 'note.updated') {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    await transporter.sendMail({
      from: 'notifications@your-domain.com',
      to: 'team@your-domain.com',
      subject: `笔记更新：${title}`,
      html: `
        <h2>笔记已更新</h2>
        <p><strong>${userName}</strong> 更新了笔记《${title}》</p>
        <p><a href="https://your-app.com/notes/${noteId}">查看笔记</a></p>
      `
    });
  }
  
  res.status(200).send('OK');
});
```

### 4. 触发 CI/CD 流程

笔记更新时触发文档构建：

```javascript
app.post('/webhook/ci', async (req, res) => {
  const { event, noteId, folderId } = req.body;
  
  // 只处理文档文件夹中的笔记
  if (event === 'note.updated' && folderId === 'docs-folder-id') {
    // 触发 GitHub Actions
    await fetch('https://api.github.com/repos/owner/repo/dispatches', {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_type: 'rebuild-docs',
        client_payload: {
          noteId: noteId
        }
      })
    });
  }
  
  res.status(200).send('OK');
});
```

## 监控和调试

### Webhook 日志

系统会记录所有 Webhook 投递：

- **成功投递**：显示响应时间和状态码
- **失败投递**：显示错误原因和重试次数
- **日志保留**：保留最近 30 天的日志

### 查看日志

1. 进入设置 → Webhook
2. 点击"查看日志"
3. 筛选：
   - 按事件类型
   - 按状态（成功/失败）
   - 按时间范围

### 调试技巧

1. **使用测试工具**：
   - [Webhook.site](https://webhook.site) - 临时 Webhook URL
   - [RequestBin](https://requestbin.com) - 查看请求详情
   - [ngrok](https://ngrok.com) - 本地开发隧道

2. **本地测试**：
   ```bash
   # 使用 ngrok 创建公网隧道
   ngrok http 3000
   
   # 将 ngrok URL 配置为 Webhook URL
   https://abc123.ngrok.io/webhook
   ```

3. **日志记录**：
   ```javascript
   app.post('/webhook', (req, res) => {
     // 记录完整请求
     console.log('Headers:', req.headers);
     console.log('Body:', req.body);
     
     // 处理逻辑
     // ...
     
     res.status(200).send('OK');
   });
   ```

## 最佳实践

### 1. 快速响应

Webhook 端点应该快速响应：

```javascript
// ✓ 好的做法：立即返回，异步处理
app.post('/webhook', async (req, res) => {
  // 立即返回 200
  res.status(200).send('OK');
  
  // 异步处理
  processWebhook(req.body).catch(console.error);
});

// ✗ 不好的做法：等待处理完成
app.post('/webhook', async (req, res) => {
  await longRunningTask(req.body);  // 可能超时
  res.status(200).send('OK');
});
```

### 2. 幂等性处理

使用投递 ID 确保幂等性：

```javascript
const processedDeliveries = new Set();

app.post('/webhook', (req, res) => {
  const deliveryId = req.headers['x-webhook-delivery'];
  
  // 检查是否已处理
  if (processedDeliveries.has(deliveryId)) {
    return res.status(200).send('Already processed');
  }
  
  // 处理 Webhook
  processWebhook(req.body);
  
  // 记录已处理
  processedDeliveries.add(deliveryId);
  
  res.status(200).send('OK');
});
```

### 3. 错误处理

优雅处理错误：

```javascript
app.post('/webhook', async (req, res) => {
  try {
    await processWebhook(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    // 返回 5xx 触发重试
    res.status(500).send('Internal error');
  }
});
```

### 4. 速率限制

防止过载：

```javascript
const rateLimit = require('express-rate-limit');

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 分钟
  max: 100  // 最多 100 个请求
});

app.post('/webhook', webhookLimiter, (req, res) => {
  // 处理 Webhook
});
```

## 常见问题

### Q: Webhook 没有收到请求？

A: 检查：
- URL 是否正确且可访问
- 是否使用 HTTPS
- 防火墙是否阻止
- 服务器是否正常运行
- 查看 Webhook 日志中的错误信息

### Q: 如何测试 Webhook？

A: 方法：
- 使用"测试"按钮发送测试请求
- 使用 webhook.site 等工具
- 使用 ngrok 进行本地测试
- 查看日志中的请求详情

### Q: Webhook 重试太多次？

A: 确保：
- 端点在 5 秒内响应
- 返回 2xx 状态码
- 网络连接稳定
- 服务器负载正常

### Q: 如何处理大量 Webhook？

A: 建议：
- 使用消息队列（如 RabbitMQ、Redis）
- 异步处理请求
- 实现速率限制
- 水平扩展服务器

### Q: 可以禁用某个 Webhook 吗？

A: 可以：
- 在 Webhook 列表中找到对应项
- 点击"禁用"按钮
- 禁用后不会发送请求，但配置保留

## 技术支持

如果遇到问题：
1. 查看 Webhook 日志
2. 检查服务器日志
3. 使用测试工具验证
4. 联系技术支持团队
