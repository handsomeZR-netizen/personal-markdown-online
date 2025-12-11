/**
 * 添加中文示例笔记数据
 * 运行: npx tsx scripts/seed-chinese-notes.ts
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// 中文标签
const chineseTags = [
  '工作', '学习', '生活', '技术', '读书笔记',
  '项目管理', '会议记录', '灵感', '待办', '重要'
];

// 中文分类
const chineseCategories = [
  '工作笔记', '学习资料', '个人日记', '技术文档', '读书心得'
];

// 中文文件夹
const chineseFolders = [
  '工作项目',
  '学习笔记',
  '技术文档',
  '读书笔记',
  '生活记录'
];

// 中文笔记内容
const chineseNotes = [
  {
    title: 'Next.js 15 新特性总结',
    content: `# Next.js 15 新特性总结

## 主要更新

### 1. React 19 支持
Next.js 15 完全支持 React 19，包括新的并发特性和改进的服务器组件。

### 2. Turbopack 稳定版
- 开发服务器启动速度提升 76%
- 热更新速度提升 96%
- 更好的内存管理

### 3. 新的缓存策略
\`\`\`typescript
// 默认不再缓存 fetch 请求
const data = await fetch('https://api.example.com/data');

// 需要显式启用缓存
const cachedData = await fetch('https://api.example.com/data', {
  cache: 'force-cache'
});
\`\`\`

### 4. 部分预渲染 (PPR)
支持在同一页面中混合静态和动态内容。

## 迁移建议
1. 更新 package.json 中的依赖版本
2. 检查缓存相关代码
3. 测试所有 API 路由

## 参考链接
- [官方文档](https://nextjs.org/docs)
- [升级指南](https://nextjs.org/docs/upgrading)`,
    tags: ['技术', '学习'],
    category: '技术文档'
  },
  {
    title: '每周工作计划模板',
    content: `# 每周工作计划

## 本周目标
- [ ] 完成项目 A 的需求分析
- [ ] 代码审查 3 个 PR
- [ ] 参加周三的技术分享会

## 周一
- 上午：团队站会，回顾上周工作
- 下午：需求评审会议

## 周二
- 上午：编写技术方案
- 下午：代码开发

## 周三
- 上午：代码开发
- 下午：技术分享会

## 周四
- 上午：代码审查
- 下午：Bug 修复

## 周五
- 上午：测试验证
- 下午：周报总结

## 备注
- 记得更新项目文档
- 准备下周的演示材料`,
    tags: ['工作', '项目管理', '待办'],
    category: '工作笔记'
  },
  {
    title: 'TypeScript 高级类型技巧',
    content: `# TypeScript 高级类型技巧

## 1. 条件类型

\`\`\`typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false
\`\`\`

## 2. 映射类型

\`\`\`typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Partial<T> = {
  [P in keyof T]?: T[P];
};
\`\`\`

## 3. 模板字面量类型

\`\`\`typescript
type EventName = \`on\${Capitalize<string>}\`;
// "onClick" | "onHover" | ...
\`\`\`

## 4. infer 关键字

\`\`\`typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Fn = () => string;
type Result = ReturnType<Fn>;  // string
\`\`\`

## 5. 实用工具类型

- \`Pick<T, K>\` - 选择部分属性
- \`Omit<T, K>\` - 排除部分属性
- \`Record<K, T>\` - 创建对象类型
- \`Exclude<T, U>\` - 排除类型
- \`Extract<T, U>\` - 提取类型

## 总结
掌握这些高级类型可以让你的代码更加类型安全，减少运行时错误。`,
    tags: ['技术', '学习'],
    category: '技术文档'
  },
  {
    title: '《原子习惯》读书笔记',
    content: `# 《原子习惯》读书笔记

## 核心观点

> 习惯是自我提升的复利。

### 四大习惯法则

1. **让它显而易见** (Cue)
   - 设计你的环境
   - 使用习惯堆叠

2. **让它有吸引力** (Craving)
   - 使用诱惑捆绑
   - 加入志同道合的群体

3. **让它简单易行** (Response)
   - 减少阻力
   - 两分钟法则

4. **让它令人愉悦** (Reward)
   - 即时奖励
   - 习惯追踪

## 关键概念

### 1% 法则
每天进步 1%，一年后你会进步 37 倍。

### 身份认同
不要说"我想戒烟"，而是说"我不是吸烟者"。

### 习惯堆叠
在现有习惯后面添加新习惯：
"在我 [现有习惯] 之后，我会 [新习惯]"

## 我的行动计划
1. 每天早上起床后立即阅读 10 分钟
2. 每次打开电脑前先写下今天的三个目标
3. 每天睡前记录三件感恩的事

## 金句摘录
- "你不会上升到目标的高度，你会下降到系统的水平。"
- "每一个行动都是对你想成为的人的一次投票。"`,
    tags: ['读书笔记', '学习', '生活'],
    category: '读书心得'
  },
  {
    title: 'React Hooks 最佳实践',
    content: `# React Hooks 最佳实践

## useState

### ✅ 正确用法
\`\`\`jsx
const [count, setCount] = useState(0);

// 使用函数式更新
setCount(prev => prev + 1);
\`\`\`

### ❌ 避免
\`\`\`jsx
// 不要在条件语句中使用 hooks
if (condition) {
  const [value, setValue] = useState(0); // 错误！
}
\`\`\`

## useEffect

### 依赖数组
\`\`\`jsx
// 只在 userId 变化时执行
useEffect(() => {
  fetchUser(userId);
}, [userId]);

// 清理函数
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);
\`\`\`

## useMemo 和 useCallback

### 何时使用
- 计算开销大的操作
- 传递给子组件的回调函数
- 作为其他 hooks 的依赖

\`\`\`jsx
const memoizedValue = useMemo(() => {
  return expensiveCalculation(a, b);
}, [a, b]);

const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
\`\`\`

## 自定义 Hooks

\`\`\`jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
\`\`\`

## 性能优化建议
1. 避免在渲染期间创建新对象/数组
2. 使用 React.memo 包装纯组件
3. 合理拆分组件，减少重渲染范围`,
    tags: ['技术', '学习'],
    category: '技术文档'
  },
  {
    title: '2024 年度目标规划',
    content: `# 2024 年度目标规划

## 职业发展
- [ ] 晋升到高级工程师
- [ ] 完成 3 个重要项目
- [ ] 获得 AWS 认证
- [ ] 在技术博客发表 12 篇文章

## 学习成长
- [ ] 阅读 24 本书
- [ ] 学习 Rust 语言基础
- [ ] 完成机器学习入门课程
- [ ] 提升英语口语能力

## 健康生活
- [ ] 每周运动 3 次
- [ ] 保持健康体重
- [ ] 每天睡眠 7 小时以上
- [ ] 减少屏幕时间

## 财务目标
- [ ] 储蓄率达到 30%
- [ ] 建立应急基金
- [ ] 学习投资理财知识

## 人际关系
- [ ] 每月与家人聚餐
- [ ] 维护重要的友谊
- [ ] 参加 2 次技术社区活动

## 季度回顾时间
- Q1 回顾：4月1日
- Q2 回顾：7月1日
- Q3 回顾：10月1日
- Q4 回顾：12月31日

## 每月检查清单
- 回顾本月目标完成情况
- 调整下月计划
- 记录成就和感悟`,
    tags: ['生活', '重要', '待办'],
    category: '个人日记'
  },
  {
    title: 'Git 常用命令速查',
    content: `# Git 常用命令速查

## 基础操作

\`\`\`bash
# 初始化仓库
git init

# 克隆仓库
git clone <url>

# 查看状态
git status

# 添加文件
git add .
git add <file>

# 提交
git commit -m "message"
\`\`\`

## 分支操作

\`\`\`bash
# 查看分支
git branch

# 创建分支
git branch <name>

# 切换分支
git checkout <name>
git switch <name>

# 创建并切换
git checkout -b <name>

# 合并分支
git merge <branch>

# 删除分支
git branch -d <name>
\`\`\`

## 远程操作

\`\`\`bash
# 查看远程
git remote -v

# 拉取
git pull origin main

# 推送
git push origin main

# 获取
git fetch origin
\`\`\`

## 撤销操作

\`\`\`bash
# 撤销工作区修改
git checkout -- <file>

# 撤销暂存
git reset HEAD <file>

# 撤销提交（保留修改）
git reset --soft HEAD^

# 撤销提交（丢弃修改）
git reset --hard HEAD^
\`\`\`

## 查看历史

\`\`\`bash
# 查看日志
git log
git log --oneline
git log --graph

# 查看差异
git diff
git diff --staged
\`\`\`

## 实用技巧

\`\`\`bash
# 暂存当前修改
git stash
git stash pop

# 修改最后一次提交
git commit --amend

# 交互式变基
git rebase -i HEAD~3

# 查找引入 bug 的提交
git bisect start
\`\`\``,
    tags: ['技术', '工作'],
    category: '技术文档'
  },
  {
    title: '项目复盘：电商平台重构',
    content: `# 项目复盘：电商平台重构

## 项目背景
- 项目周期：3 个月
- 团队规模：5 人
- 技术栈：Next.js + TypeScript + PostgreSQL

## 项目目标
1. 提升页面加载速度 50%
2. 改善代码可维护性
3. 支持移动端适配

## 完成情况

### ✅ 达成目标
- 首屏加载时间从 4s 降到 1.5s
- 代码覆盖率从 30% 提升到 75%
- 移动端用户满意度提升 40%

### ⚠️ 部分达成
- API 响应时间优化（目标 100ms，实际 150ms）

### ❌ 未达成
- 国际化支持（延期到下一版本）

## 经验教训

### 做得好的
1. 早期进行技术选型评估
2. 每周进行代码审查
3. 持续集成/持续部署

### 需要改进的
1. 需求变更管理不够严格
2. 文档更新不及时
3. 测试用例覆盖不全面

## 后续计划
1. 完成国际化支持
2. 优化 API 性能
3. 添加更多自动化测试

## 团队感谢
感谢所有团队成员的辛勤付出！`,
    tags: ['工作', '项目管理', '会议记录'],
    category: '工作笔记'
  },
  {
    title: 'CSS Grid 布局完全指南',
    content: `# CSS Grid 布局完全指南

## 基础概念

### 容器属性

\`\`\`css
.container {
  display: grid;
  
  /* 定义列 */
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-columns: repeat(3, 1fr);
  grid-template-columns: minmax(100px, 1fr);
  
  /* 定义行 */
  grid-template-rows: 100px auto 100px;
  
  /* 间距 */
  gap: 20px;
  row-gap: 10px;
  column-gap: 20px;
}
\`\`\`

### 项目属性

\`\`\`css
.item {
  /* 位置 */
  grid-column: 1 / 3;
  grid-row: 1 / 2;
  
  /* 简写 */
  grid-area: 1 / 1 / 2 / 3;
}
\`\`\`

## 常用布局

### 圣杯布局

\`\`\`css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.header { grid-area: header; }
.nav    { grid-area: nav; }
.main   { grid-area: main; }
.aside  { grid-area: aside; }
.footer { grid-area: footer; }
\`\`\`

### 响应式卡片

\`\`\`css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
\`\`\`

## 对齐方式

\`\`\`css
.container {
  /* 整体对齐 */
  justify-content: center;
  align-content: center;
  
  /* 项目对齐 */
  justify-items: center;
  align-items: center;
}

.item {
  /* 单个项目对齐 */
  justify-self: start;
  align-self: end;
}
\`\`\`

## 实用技巧
1. 使用 \`fr\` 单位实现弹性布局
2. \`auto-fit\` vs \`auto-fill\` 的区别
3. 结合媒体查询实现响应式`,
    tags: ['技术', '学习'],
    category: '技术文档'
  },
  {
    title: '日常灵感收集',
    content: `# 日常灵感收集

## 产品创意

### 智能笔记应用
- 自动整理和分类笔记
- AI 生成摘要和标签
- 跨设备实时同步
- 支持 Markdown 和富文本

### 习惯追踪器
- 可视化习惯完成情况
- 提醒和激励机制
- 社交分享功能

## 技术探索

### 想学习的技术
- WebAssembly
- Rust
- GraphQL
- Kubernetes

### 想做的项目
- 个人博客系统
- 开源贡献
- 技术播客

## 生活感悟

> "最好的时间是十年前，其次是现在。"

### 今日思考
- 专注比努力更重要
- 持续学习是最好的投资
- 健康是一切的基础

## 书单
- [ ] 《深入理解计算机系统》
- [ ] 《设计模式》
- [ ] 《重构》
- [ ] 《代码整洁之道》

## 电影推荐
- 《社交网络》
- 《模仿游戏》
- 《黑客帝国》`,
    tags: ['灵感', '生活', '学习'],
    category: '个人日记'
  }
];

// 中文模板
const chineseTemplates = [
  {
    name: '会议记录模板',
    description: '用于记录会议内容的标准模板',
    content: `# 会议记录

## 基本信息
- **日期**：
- **时间**：
- **地点**：
- **参会人员**：

## 会议议程
1. 
2. 
3. 

## 讨论内容

### 议题一

### 议题二

## 决议事项
- [ ] 
- [ ] 

## 下次会议
- 时间：
- 议题：`
  },
  {
    name: '周报模板',
    description: '每周工作总结模板',
    content: `# 周报 - 第 X 周

## 本周完成
- 
- 
- 

## 进行中
- 
- 

## 下周计划
- 
- 
- 

## 遇到的问题
- 

## 需要的支持
- `
  },
  {
    name: '读书笔记模板',
    description: '记录读书心得的模板',
    content: `# 《书名》读书笔记

## 基本信息
- **作者**：
- **出版社**：
- **阅读日期**：

## 内容摘要

## 核心观点
1. 
2. 
3. 

## 精彩摘录
> 

## 我的思考

## 行动计划
- [ ] 
- [ ] `
  }
];

async function seedChineseData() {
  console.log('🌱 开始添加中文示例数据...\n');

  try {
    // 获取第一个用户
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('❌ 没有找到用户，请先运行 npm run db:seed');
      return;
    }

    console.log(`👤 使用用户: ${user.email}\n`);

    // 创建中文标签
    console.log('🏷️  创建中文标签...');
    const tags: { id: string; name: string }[] = [];
    for (const tagName of chineseTags) {
      const existingTag = await prisma.tag.findFirst({ where: { name: tagName } });
      if (existingTag) {
        tags.push(existingTag);
      } else {
        const tag = await prisma.tag.create({ data: { id: randomUUID(), name: tagName } });
        tags.push(tag);
      }
    }
    console.log(`✅ 创建了 ${tags.length} 个标签\n`);

    // 创建中文分类
    console.log('📁 创建中文分类...');
    const categories: { id: string; name: string }[] = [];
    for (const categoryName of chineseCategories) {
      const existingCategory = await prisma.category.findFirst({ where: { name: categoryName } });
      if (existingCategory) {
        categories.push(existingCategory);
      } else {
        const category = await prisma.category.create({ data: { id: randomUUID(), name: categoryName } });
        categories.push(category);
      }
    }
    console.log(`✅ 创建了 ${categories.length} 个分类\n`);

    // 创建中文文件夹
    console.log('📂 创建中文文件夹...');
    const folders: { id: string; name: string }[] = [];
    for (const folderName of chineseFolders) {
      const existingFolder = await prisma.folder.findFirst({ 
        where: { name: folderName, userId: user.id } 
      });
      if (existingFolder) {
        folders.push(existingFolder);
      } else {
        const folder = await prisma.folder.create({
          data: { id: randomUUID(), name: folderName, userId: user.id, updatedAt: new Date() }
        });
        folders.push(folder);
      }
    }
    console.log(`✅ 创建了 ${folders.length} 个文件夹\n`);

    // 创建中文笔记
    console.log('📝 创建中文笔记...');
    let noteCount = 0;
    for (const noteData of chineseNotes) {
      // 查找对应的标签
      const noteTags = tags.filter(t => noteData.tags.includes(t.name));
      
      // 查找对应的分类
      const category = categories.find(c => c.name === noteData.category);
      
      // 查找对应的文件夹
      const folder = folders.find(f => {
        if (noteData.category.includes('技术')) return f.name === '技术文档';
        if (noteData.category.includes('读书')) return f.name === '读书笔记';
        if (noteData.category.includes('工作')) return f.name === '工作项目';
        if (noteData.category.includes('学习')) return f.name === '学习笔记';
        return f.name === '生活记录';
      });

      await prisma.note.create({
        data: {
          id: randomUUID(),
          title: noteData.title,
          content: noteData.content,
          userId: user.id,
          ownerId: user.id,
          categoryId: category?.id,
          folderId: folder?.id,
          updatedAt: new Date(),
          Tag: {
            connect: noteTags.map(t => ({ id: t.id }))
          }
        }
      });
      noteCount++;
      console.log(`  ✓ ${noteData.title}`);
    }
    console.log(`\n✅ 创建了 ${noteCount} 篇笔记\n`);

    // 创建中文模板
    console.log('📋 创建中文模板...');
    let templateCount = 0;
    for (const template of chineseTemplates) {
      const existingTemplate = await prisma.noteTemplate.findFirst({
        where: { name: template.name, userId: user.id }
      });
      if (!existingTemplate) {
        await prisma.noteTemplate.create({
          data: {
            id: randomUUID(),
            name: template.name,
            description: template.description,
            content: template.content,
            userId: user.id,
            updatedAt: new Date()
          }
        });
        templateCount++;
        console.log(`  ✓ ${template.name}`);
      }
    }
    console.log(`\n✅ 创建了 ${templateCount} 个模板\n`);

    console.log('✨ 中文示例数据添加完成！');
    console.log('\n📊 总结:');
    console.log(`   标签: ${tags.length}`);
    console.log(`   分类: ${categories.length}`);
    console.log(`   文件夹: ${folders.length}`);
    console.log(`   笔记: ${noteCount}`);
    console.log(`   模板: ${templateCount}`);

  } catch (error) {
    console.error('❌ 添加数据失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
seedChineseData()
  .then(() => {
    console.log('\n✅ 脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 脚本执行失败:', error);
    process.exit(1);
  });
