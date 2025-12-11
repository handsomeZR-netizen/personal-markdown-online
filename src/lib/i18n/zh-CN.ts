/**
 * 中文（简体）翻译文件
 * Chinese (Simplified) translations
 */

export const translations = {
  // 通用
  common: {
    appName: '苹果笔记',
    loading: '加载中...',
    saving: '保存中...',
    saved: '已保存',
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    edit: '编辑',
    create: '创建',
    search: '搜索',
    filter: '筛选',
    clear: '清除',
    close: '关闭',
    back: '返回',
    next: '下一页',
    previous: '上一页',
    submit: '提交',
    success: '成功',
    error: '错误',
    warning: '警告',
    info: '信息',
  },

  // 认证
  auth: {
    login: '登录',
    register: '注册',
    logout: '退出登录',
    email: '邮箱',
    password: '密码',
    confirmPassword: '确认密码',
    name: '姓名',
    forgotPassword: '忘记密码？',
    noAccount: '还没有账号？',
    hasAccount: '已有账号？',
    loginNow: '立即登录',
    registerNow: '立即注册',
    loginSuccess: '登录成功',
    registerSuccess: '注册成功',
    logoutSuccess: '退出登录成功',
    loginError: '登录失败',
    registerError: '注册失败',
    invalidCredentials: '邮箱或密码错误',
    emailRequired: '请输入邮箱',
    emailInvalid: '邮箱格式不正确',
    passwordRequired: '请输入密码',
    passwordMinLength: '密码至少需要6个字符',
    passwordMismatch: '两次输入的密码不一致',
    nameRequired: '请输入姓名',
    nameMinLength: '姓名至少需要2个字符',
  },

  // 笔记
  notes: {
    title: '标题',
    content: '内容',
    createNote: '创建笔记',
    editNote: '编辑笔记',
    deleteNote: '删除笔记',
    viewNote: '查看笔记',
    newNote: '新建笔记',
    myNotes: '我的笔记',
    allNotes: '所有笔记',
    noteList: '笔记列表',
    noteDetail: '笔记详情',
    noNotes: '暂无笔记',
    noNotesDescription: '开始创建你的第一条笔记吧',
    titleRequired: '请输入标题',
    titleMaxLength: '标题不能超过200个字符',
    contentRequired: '请输入内容',
    createSuccess: '笔记创建成功',
    updateSuccess: '笔记更新成功',
    deleteSuccess: '笔记删除成功',
    createError: '笔记创建失败',
    updateError: '笔记更新失败',
    deleteError: '笔记删除失败',
    deleteConfirm: '确定要删除这条笔记吗？',
    deleteConfirmDescription: '此操作无法撤销',
    autoSaving: '自动保存中...',
    autoSaved: '已自动保存',
    lastSaved: '最后保存于',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    summary: '摘要',
    preview: '预览',
    editor: '编辑器',
  },

  // 标签
  tags: {
    tags: '标签',
    addTag: '添加标签',
    createTag: '创建标签',
    selectTags: '选择标签',
    noTags: '暂无标签',
    tagName: '标签名称',
    tagRequired: '请输入标签名称',
    tagExists: '标签已存在',
    createSuccess: '标签创建成功',
    createError: '标签创建失败',
  },

  // 分类
  categories: {
    category: '分类',
    categories: '分类',
    addCategory: '添加分类',
    createCategory: '创建分类',
    selectCategory: '选择分类',
    noCategory: '无分类',
    noCategories: '暂无分类',
    categoryName: '分类名称',
    categoryRequired: '请输入分类名称',
    categoryExists: '分类已存在',
    createSuccess: '分类创建成功',
    createError: '分类创建失败',
  },

  // 搜索和筛选
  search: {
    search: '搜索',
    searchPlaceholder: '搜索笔记...',
    searchNotes: '搜索笔记',
    searchResults: '搜索结果',
    noResults: '未找到相关笔记',
    noResultsDescription: '尝试使用不同的关键词',
    filterByTags: '按标签筛选',
    filterByCategory: '按分类筛选',
    clearFilters: '清除筛选',
    appliedFilters: '已应用的筛选条件',
    keyword: '关键词',
    advancedSearch: '高级搜索',
  },

  // 分页
  pagination: {
    page: '第',
    of: '页，共',
    pages: '页',
    showing: '显示',
    to: '至',
    of_total: '条，共',
    items: '条',
    perPage: '每页',
    goToPage: '跳转到',
    firstPage: '首页',
    lastPage: '末页',
    previousPage: '上一页',
    nextPage: '下一页',
  },

  // 排序
  sort: {
    sortBy: '排序方式',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    title: '标题',
    ascending: '升序',
    descending: '降序',
    newest: '最新',
    oldest: '最旧',
  },

  // 主题
  theme: {
    theme: '主题',
    light: '浅色',
    dark: '深色',
    system: '跟随系统',
    toggleTheme: '切换主题',
  },

  // 导航
  navigation: {
    home: '首页',
    dashboard: '仪表盘',
    notes: '笔记',
    settings: '设置',
    profile: '个人资料',
    menu: '菜单',
  },

  // Markdown编辑器
  editor: {
    bold: '粗体',
    italic: '斜体',
    heading: '标题',
    link: '链接',
    image: '图片',
    code: '代码',
    quote: '引用',
    list: '列表',
    orderedList: '有序列表',
    unorderedList: '无序列表',
    toolbar: '工具栏',
    insertLink: '插入链接',
    insertImage: '插入图片',
    linkText: '链接文本',
    linkUrl: '链接地址',
    imageUrl: '图片地址',
    imageAlt: '图片描述',
  },

  // AI功能
  ai: {
    aiFeatures: 'AI功能',
    suggestTags: 'AI建议标签',
    generateSummary: '生成摘要',
    regenerateSummary: '重新生成摘要',
    semanticSearch: '语义搜索',
    naturalLanguageQuery: '自然语言查询',
    askQuestion: '提问',
    aiSearchPlaceholder: '用自然语言搜索笔记...',
    aiAnswer: 'AI回答',
    relatedNotes: '相关笔记',
    generating: '生成中...',
    generationError: '生成失败',
    searchHistory: '搜索历史',
    clearHistory: '清空历史',
    conversationHistory: '对话历史',
    newConversation: '新对话',
    noHistory: '暂无历史记录',
    deleteConversation: '删除对话',
    clearAllConversations: '清空所有对话',
    conversationDeleted: '对话已删除',
    allConversationsCleared: '所有对话已清空',
    historySaved: '已自动保存',
  },

  // 错误消息
  errors: {
    generic: '发生错误，请稍后重试',
    networkError: '网络错误，请检查网络连接',
    unauthorized: '未授权，请先登录',
    forbidden: '无权访问',
    notFound: '未找到',
    validationError: '验证失败',
    serverError: '服务器错误',
    timeout: '请求超时',
  },

  // 成功消息
  success: {
    operationSuccess: '操作成功',
    saveSuccess: '保存成功',
    deleteSuccess: '删除成功',
    updateSuccess: '更新成功',
    createSuccess: '创建成功',
  },

  // 确认对话框
  dialog: {
    areYouSure: '确定吗？',
    cannotUndo: '此操作无法撤销',
    confirmDelete: '确认删除',
    confirmAction: '确认操作',
  },

  // 快捷键
  shortcuts: {
    shortcuts: '快捷键',
    keyboardShortcuts: '键盘快捷键',
    save: '保存',
    search: '搜索',
    close: '关闭',
    bold: '粗体',
    italic: '斜体',
    link: '链接',
    showShortcuts: '显示快捷键',
  },

  // 响应式
  responsive: {
    mobileView: '移动视图',
    tabletView: '平板视图',
    desktopView: '桌面视图',
    toggleSidebar: '切换侧边栏',
    togglePreview: '切换预览',
  },

  // 无障碍
  accessibility: {
    skipToContent: '跳转到内容',
    openMenu: '打开菜单',
    closeMenu: '关闭菜单',
    loading: '正在加载',
    screenReaderOnly: '仅屏幕阅读器',
  },
} as const;

export type TranslationKey = keyof typeof translations;
export type Translation = typeof translations;

export default translations;
