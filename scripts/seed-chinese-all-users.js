const { PrismaClient } = require('@prisma/client');

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
    content: `# Next.js 15 新特性总结\n\n## 主要更新\n\n### 1. React 19 支持\nNext.js 15 完全支持 React 19，包括新的并发特性和改进的服务器组件。\n\n### 2. Turbopack 稳定版\n- 开发服务器启动速度提升 76%\n- 热更新速度提升 96%`,
    tags: ['技术', '学习'],
    category: '技术文档'
  },
  {
    title: '每周工作计划模板',
    content: `# 每周工作计划\n\n## 本周目标\n- [ ] 完成项目 A 的需求分析\n- [ ] 代码审查 3 个 PR\n- [ ] 参加周三的技术分享会`,
    tags: ['工作', '项目管理', '待办'],
    category: '工作笔记'
  },
  {
    title: 'TypeScript 高级类型技巧',
    content: `# TypeScript 高级类型技巧\n\n## 1. 条件类型\n\n\`\`\`typescript\ntype IsString<T> = T extends string ? true : false;\n\`\`\``,
    tags: ['技术', '学习'],
    category: '技术文档'
  },
  {
    title: '《原子习惯》读书笔记',
    content: `# 《原子习惯》读书笔记\n\n## 核心观点\n\n> 习惯是自我提升的复利。\n\n### 四大习惯法则\n1. 让它显而易见\n2. 让它有吸引力\n3. 让它简单易行\n4. 让它令人愉悦`,
    tags: ['读书笔记', '学习', '生活'],
    category: '读书心得'
  },
  {
    title: 'React Hooks 最佳实践',
    content: `# React Hooks 最佳实践\n\n## useState\n\n### ✅ 正确用法\n\`\`\`jsx\nconst [count, setCount] = useState(0);\nsetCount(prev => prev + 1);\n\`\`\``,
    tags: ['技术', '学习'],
    category: '技术文档'
  },
  {
    title: '2024 年度目标规划',
    content: `# 2024 年度目标规划\n\n## 职业发展\n- [ ] 晋升到高级工程师\n- [ ] 完成 3 个重要项目\n\n## 学习成长\n- [ ] 阅读 24 本书\n- [ ] 学习 Rust 语言基础`,
    tags: ['生活', '重要', '待办'],
    category: '个人日记'
  },
  {
    title: 'Git 常用命令速查',
    content: `# Git 常用命令速查\n\n## 基础操作\n\n\`\`\`bash\ngit init\ngit clone <url>\ngit status\ngit add .\ngit commit -m "message"\n\`\`\``,
    tags: ['技术', '工作'],
    category: '技术文档'
  },
  {
    title: '项目复盘：电商平台重构',
    content: `# 项目复盘：电商平台重构\n\n## 项目背景\n- 项目周期：3 个月\n- 团队规模：5 人\n- 技术栈：Next.js + TypeScript + PostgreSQL`,
    tags: ['工作', '项目管理', '会议记录'],
    category: '工作笔记'
  },
  {
    title: 'CSS Grid 布局完全指南',
    content: `# CSS Grid 布局完全指南\n\n## 基础概念\n\n\`\`\`css\n.container {\n  display: grid;\n  grid-template-columns: 1fr 2fr 1fr;\n  gap: 20px;\n}\n\`\`\``,
    tags: ['技术', '学习'],
    category: '技术文档'
  },
  {
    title: '日常灵感收集',
    content: `# 日常灵感收集\n\n## 产品创意\n\n### 智能笔记应用\n- 自动整理和分类笔记\n- AI 生成摘要和标签\n- 跨设备实时同步`,
    tags: ['灵感', '生活', '学习'],
    category: '个人日记'
  }
];

async function seedChineseData() {
  console.log('🌱 开始为所有用户添加中文示例数据...\n');

  try {
    // 获取所有用户
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.error('❌ 没有找到用户');
      return;
    }

    console.log(`👤 找到 ${users.length} 个用户\n`);

    // 创建中文标签
    console.log('🏷️  创建中文标签...');
    const tags = [];
    for (const tagName of chineseTags) {
      let tag = await prisma.tag.findFirst({ where: { name: tagName } });
      if (!tag) {
        tag = await prisma.tag.create({ data: { name: tagName } });
      }
      tags.push(tag);
    }
    console.log(`✅ 标签准备完成: ${tags.length} 个\n`);

    // 创建中文分类
    console.log('📁 创建中文分类...');
    const categories = [];
    for (const categoryName of chineseCategories) {
      let category = await prisma.category.findFirst({ where: { name: categoryName } });
      if (!category) {
        category = await prisma.category.create({ data: { name: categoryName } });
      }
      categories.push(category);
    }
    console.log(`✅ 分类准备完成: ${categories.length} 个\n`);

    // 为每个用户创建文件夹和笔记
    for (const user of users) {
      console.log(`\n📝 为用户 ${user.email} 添加数据...`);

      // 创建文件夹
      const folders = [];
      for (const folderName of chineseFolders) {
        let folder = await prisma.folder.findFirst({ 
          where: { name: folderName, userId: user.id } 
        });
        if (!folder) {
          folder = await prisma.folder.create({
            data: { name: folderName, userId: user.id }
          });
        }
        folders.push(folder);
      }
      console.log(`  ✓ 文件夹: ${folders.length} 个`);

      // 创建笔记
      let noteCount = 0;
      for (const noteData of chineseNotes) {
        // 检查是否已存在
        const existing = await prisma.note.findFirst({
          where: { title: noteData.title, userId: user.id }
        });
        if (existing) continue;

        const noteTags = tags.filter(t => noteData.tags.includes(t.name));
        const category = categories.find(c => c.name === noteData.category);
        const folder = folders.find(f => {
          if (noteData.category.includes('技术')) return f.name === '技术文档';
          if (noteData.category.includes('读书')) return f.name === '读书笔记';
          if (noteData.category.includes('工作')) return f.name === '工作项目';
          if (noteData.category.includes('学习')) return f.name === '学习笔记';
          return f.name === '生活记录';
        });

        await prisma.note.create({
          data: {
            title: noteData.title,
            content: noteData.content,
            userId: user.id,
            ownerId: user.id,
            categoryId: category?.id,
            folderId: folder?.id,
            tags: { connect: noteTags.map(t => ({ id: t.id })) }
          }
        });
        noteCount++;
      }
      console.log(`  ✓ 笔记: ${noteCount} 篇`);
    }

    console.log('\n✨ 中文示例数据添加完成！');

  } catch (error) {
    console.error('❌ 添加数据失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedChineseData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
