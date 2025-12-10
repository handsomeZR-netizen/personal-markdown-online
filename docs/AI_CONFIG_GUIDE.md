# AI API 配置指南

## 更新时间
2024年11月20日

## 功能概述

新增了AI API配置管理功能，允许用户自定义AI服务提供商和API密钥，支持多种AI服务。

## 主要特性

### 1. 支持多个AI提供商
- **DeepSeek**: 默认提供商，性价比高
- **OpenAI**: GPT-3.5/GPT-4系列模型
- **自定义**: 支持任何兼容OpenAI API格式的服务

### 2. 灵活的配置管理
- 配置保存在浏览器本地存储
- 支持测试API连接
- 可随时切换提供商
- 重置为默认配置

### 3. 优先级机制
```
用户自定义配置 > 环境变量配置
```

## 使用指南

### 访问设置页面

1. 登录应用
2. 点击顶部导航栏的"设置"按钮
3. 进入AI API配置页面

### 配置步骤

#### 1. 选择AI提供商
```
DeepSeek (推荐) | OpenAI | 自定义
```

#### 2. 输入API Key
- DeepSeek: 在 https://platform.deepseek.com 获取
- OpenAI: 在 https://platform.openai.com 获取
- 自定义: 使用你的服务提供的密钥

#### 3. 配置API URL（可选）
- 系统会自动填充默认URL
- 可以修改为自定义端点

#### 4. 选择模型
- DeepSeek: `deepseek-chat`
- OpenAI: `gpt-3.5-turbo` 或 `gpt-4`
- 自定义: 输入你的模型名称

#### 5. 测试连接
- 点击"测试连接"按钮
- 验证配置是否正确
- 查看测试结果

#### 6. 保存配置
- 点击"保存配置"按钮
- 配置立即生效

## 配置示例

### DeepSeek 配置
```
提供商: DeepSeek
API Key: sk-xxxxxxxxxxxxxxxx
API URL: https://api.deepseek.com/v1
模型: deepseek-chat
```

### OpenAI 配置
```
提供商: OpenAI
API Key: sk-xxxxxxxxxxxxxxxx
API URL: https://api.openai.com/v1
模型: gpt-3.5-turbo
```

### 自定义配置（例如：本地部署的模型）
```
提供商: 自定义
API Key: your-custom-key
API URL: http://localhost:8000/v1
模型: llama-2-7b
```

## 技术实现

### 文件结构
```
src/
├── components/
│   └── settings/
│       └── ai-config-form.tsx      # AI配置表单组件
├── lib/
│   └── ai/
│       ├── config.ts                # 配置管理逻辑
│       └── deepseek.ts              # AI API客户端（已更新）
└── app/
    └── settings/
        └── page.tsx                 # 设置页面
```

### 配置管理 (config.ts)

#### 数据结构
```typescript
interface AIConfig {
  provider: 'deepseek' | 'openai' | 'custom';
  apiKey: string;
  apiUrl: string;
  model: string;
}
```

#### 核心函数

**获取配置**
```typescript
function getAIConfig(): AIConfig | null
```
从localStorage读取用户配置

**保存配置**
```typescript
function saveAIConfig(config: AIConfig): void
```
保存配置到localStorage

**获取当前配置**
```typescript
function getCurrentAIConfig(): AIConfig
```
优先返回用户配置，否则返回环境变量配置

**测试配置**
```typescript
async function testAIConfig(config: AIConfig): Promise<{
  success: boolean;
  error?: string;
}>
```
发送测试请求验证配置

### AI客户端更新 (deepseek.ts)

#### 动态配置加载
```typescript
function getAPIConfig() {
  const config = getCurrentAIConfig();
  return {
    apiKey: config.apiKey || DEEPSEEK_API_KEY,
    apiUrl: config.apiUrl || DEEPSEEK_API_URL,
    model: config.model || 'deepseek-chat',
  };
}
```

#### API调用更新
所有API调用函数都已更新为使用动态配置：
- `callDeepSeek()`
- `callDeepSeekWithRetry()`
- `streamDeepSeekResponse()`

### UI组件 (ai-config-form.tsx)

#### 功能特性
1. **提供商选择**: 下拉菜单切换
2. **API Key输入**: 支持显示/隐藏
3. **URL和模型配置**: 自动填充默认值
4. **测试连接**: 实时验证
5. **保存配置**: 持久化存储
6. **重置功能**: 恢复默认值

#### 状态管理
```typescript
const [provider, setProvider] = useState<AIProvider>('deepseek');
const [apiKey, setApiKey] = useState('');
const [apiUrl, setApiUrl] = useState('');
const [model, setModel] = useState('');
const [showApiKey, setShowApiKey] = useState(false);
const [isTesting, setIsTesting] = useState(false);
const [isSaving, setIsSaving] = useState(false);
```

## 修复的问题

### AI建议标签按钮禁用问题

#### 问题描述
按钮在内容少于10个字符时被禁用，导致即使有标题也无法使用。

#### 解决方案
```typescript
// 之前：只检查内容
disabled={isLoading || !content || content.trim().length < 10}

// 现在：检查标题或内容
const canGenerate = (title && title.trim().length > 0) || 
                    (content && content.trim().length > 0);
disabled={isLoading || !canGenerate}
```

#### 改进逻辑
- 标题或内容任一有值即可生成
- 组合标题和内容进行AI分析
- 最低要求：5个字符（更宽松）

## 安全性

### API Key保护
1. **本地存储**: 配置保存在浏览器localStorage
2. **不传输**: API Key不会发送到应用服务器
3. **显示控制**: 默认隐藏，点击眼睛图标显示
4. **HTTPS**: 建议使用HTTPS访问应用

### 最佳实践
- 不要在公共设备上保存配置
- 定期更换API Key
- 使用环境变量配置生产环境
- 限制API Key的权限范围

## 环境变量配置

### 开发环境 (.env.local)
```env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

### 生产环境
在部署平台（如Vercel）设置环境变量：
```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

## 故障排除

### 问题1: 测试连接失败
**可能原因**:
- API Key错误
- API URL不正确
- 网络连接问题
- API服务不可用

**解决方法**:
1. 检查API Key是否正确
2. 验证API URL格式
3. 测试网络连接
4. 查看浏览器控制台错误

### 问题2: 配置保存后不生效
**可能原因**:
- 浏览器localStorage被禁用
- 页面未刷新

**解决方法**:
1. 检查浏览器设置
2. 刷新页面
3. 清除浏览器缓存

### 问题3: AI功能无法使用
**可能原因**:
- 未配置API Key
- API额度用尽
- 模型名称错误

**解决方法**:
1. 在设置页面配置API Key
2. 检查API账户余额
3. 验证模型名称是否正确

## 使用场景

### 场景1: 个人开发者
使用DeepSeek免费额度进行开发测试：
```
提供商: DeepSeek
API Key: 从官网获取
模型: deepseek-chat
```

### 场景2: 企业用户
使用OpenAI GPT-4获得更好的效果：
```
提供商: OpenAI
API Key: 企业账户密钥
模型: gpt-4
```

### 场景3: 本地部署
使用本地部署的开源模型：
```
提供商: 自定义
API URL: http://localhost:8000/v1
模型: llama-2-7b
```

## 功能扩展

### 未来计划
1. **多配置管理**: 保存多个配置，快速切换
2. **使用统计**: 显示API调用次数和费用
3. **模型对比**: 同时使用多个模型对比结果
4. **配置导入导出**: 备份和分享配置
5. **团队配置**: 支持团队共享配置

### 贡献指南
欢迎提交PR改进此功能：
- 添加新的AI提供商支持
- 优化UI/UX
- 增强错误处理
- 添加更多测试

## 相关文档
- [DeepSeek API文档](https://platform.deepseek.com/docs)
- [OpenAI API文档](https://platform.openai.com/docs)
- [AI功能使用指南](./AI_FEATURES_README.md)
- [标签选择器设计](./TAG_SELECTOR_REDESIGN.md)

## 更新日志

### v1.0.0 (2024-11-20)
- ✨ 新增AI API配置管理功能
- ✨ 支持DeepSeek、OpenAI和自定义提供商
- ✨ 添加配置测试功能
- 🐛 修复AI建议标签按钮禁用问题
- 🎨 优化配置表单UI
- 📝 完善文档说明
