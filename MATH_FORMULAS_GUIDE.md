# 数学公式支持指南

## 📐 功能说明

笔记编辑器现在支持 LaTeX 数学公式渲染，使用 KaTeX 引擎提供快速、美观的数学公式显示。

## 🎯 支持的公式类型

### 1. 行内公式（Inline Math）

使用单个 `$` 符号包裹公式，公式会在文本行内显示。

**语法**:
```markdown
这是一个行内公式 $E = mc^2$，它会在文本中显示。
```

**效果**:
这是一个行内公式 $E = mc^2$，它会在文本中显示。

### 2. 块级公式（Display Math）

使用双 `$$` 符号或 `\[` `\]` 包裹公式，公式会独立成行居中显示。

**语法**:
```markdown
欧拉公式：

$$
e^{i\pi} + 1 = 0
$$

或者使用：

\[
V - E + F = 2
\]
```

**效果**:
欧拉公式：

$$
e^{i\pi} + 1 = 0
$$

## 📝 常用公式示例

### 基础数学

#### 1. 分数
```markdown
$\frac{a}{b}$ 或 $\frac{numerator}{denominator}$
```
显示: $\frac{a}{b}$

#### 2. 上标和下标
```markdown
$x^2$, $x_i$, $x^{2y}$, $x_{i,j}$
```
显示: $x^2$, $x_i$, $x^{2y}$, $x_{i,j}$

#### 3. 根号
```markdown
$\sqrt{x}$, $\sqrt[3]{x}$
```
显示: $\sqrt{x}$, $\sqrt[3]{x}$

#### 4. 求和与积分
```markdown
$\sum_{i=1}^{n} x_i$

$\int_{0}^{\infty} f(x) dx$
```
显示: $\sum_{i=1}^{n} x_i$, $\int_{0}^{\infty} f(x) dx$

### 高级数学

#### 1. 矩阵
```markdown
$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
$$
```

#### 2. 方程组
```markdown
$$
\begin{cases}
x + y = 5 \\
x - y = 1
\end{cases}
$$
```

#### 3. 极限
```markdown
$\lim_{x \to \infty} f(x) = L$
```
显示: $\lim_{x \to \infty} f(x) = L$

#### 4. 导数
```markdown
$\frac{dy}{dx}$, $\frac{\partial f}{\partial x}$
```
显示: $\frac{dy}{dx}$, $\frac{\partial f}{\partial x}$

### 希腊字母

```markdown
$\alpha$, $\beta$, $\gamma$, $\delta$, $\epsilon$
$\theta$, $\lambda$, $\mu$, $\pi$, $\sigma$
$\phi$, $\omega$, $\Omega$, $\Delta$, $\Gamma$
```

显示: $\alpha$, $\beta$, $\gamma$, $\delta$, $\epsilon$, $\theta$, $\lambda$, $\mu$, $\pi$, $\sigma$, $\phi$, $\omega$, $\Omega$, $\Delta$, $\Gamma$

### 运算符

```markdown
$\times$, $\div$, $\pm$, $\mp$
$\leq$, $\geq$, $\neq$, $\approx$
$\in$, $\notin$, $\subset$, $\supset$
$\cup$, $\cap$, $\emptyset$
$\forall$, $\exists$, $\nabla$
```

## 🎓 实际应用示例

### 物理公式

```markdown
## 牛顿第二定律

力等于质量乘以加速度：

$$
F = ma
$$

## 能量守恒

$$
E_k + E_p = \text{constant}
$$

其中 $E_k = \frac{1}{2}mv^2$ 是动能，$E_p = mgh$ 是势能。
```

### 数学定理

```markdown
## 勾股定理

在直角三角形中：

$$
a^2 + b^2 = c^2
$$

## 二次方程求根公式

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

### 统计学

```markdown
## 正态分布

概率密度函数：

$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}
$$

其中 $\mu$ 是均值，$\sigma$ 是标准差。
```

### 计算机科学

```markdown
## 时间复杂度

二分查找的时间复杂度：

$$
T(n) = O(\log n)
$$

## 递归关系

$$
T(n) = 2T(\frac{n}{2}) + O(n)
$$
```

## 🔧 编辑器工具栏

虽然目前没有专门的数学公式按钮，但你可以：

1. **快速插入行内公式**: 输入 `$$` 然后按空格
2. **快速插入块级公式**: 输入 `$$` 在新行，然后回车
3. **使用代码片段**: 保存常用公式为模板

## 💡 使用技巧

### 1. 预览实时更新
- 在编辑器中输入公式
- 预览窗口会实时显示渲染结果
- 桌面端可以并排查看编辑和预览

### 2. 公式对齐
```markdown
$$
\begin{aligned}
x &= a + b \\
y &= c + d
\end{aligned}
$$
```

### 3. 多行公式
```markdown
$$
\begin{gather}
a = b + c \\
d = e + f
\end{gather}
$$
```

### 4. 公式编号
```markdown
$$
E = mc^2 \tag{1}
$$
```

## 🎨 样式说明

### 深色模式支持
- 公式会自动适应深色/浅色主题
- 文字颜色自动调整
- 背景透明，与主题融合

### 字体大小
- 行内公式: 与文本大小一致
- 块级公式: 略大，更易阅读
- 可以通过 CSS 自定义

## 🐛 常见问题

### 1. 公式不显示
**问题**: 输入公式后没有渲染
**解决**: 
- 检查 `$` 符号是否成对
- 确保公式语法正确
- 刷新预览窗口

### 2. 特殊字符显示错误
**问题**: `\`, `{`, `}` 等字符显示异常
**解决**:
- 使用 `\\` 表示反斜杠
- 使用 `\{` 和 `\}` 表示花括号

### 3. 公式与文本间距
**问题**: 公式和文本贴得太近
**解决**:
- 块级公式前后留空行
- 行内公式前后加空格

## 📚 参考资源

### KaTeX 支持的函数
完整列表: https://katex.org/docs/supported.html

### 常用符号速查
- 希腊字母: https://katex.org/docs/support_table.html#greek-letters
- 运算符: https://katex.org/docs/support_table.html#operators
- 箭头: https://katex.org/docs/support_table.html#arrows

### LaTeX 教程
- Overleaf 文档: https://www.overleaf.com/learn
- LaTeX 数学符号: https://oeis.org/wiki/List_of_LaTeX_mathematical_symbols

## 🎉 开始使用

1. 打开笔记编辑器
2. 输入数学公式（使用 `$` 或 `$$`）
3. 查看预览窗口的渲染效果
4. 保存笔记

**示例笔记**:
```markdown
# 数学笔记

## 欧拉公式

最美的数学公式之一：

$$
e^{i\pi} + 1 = 0
$$

这个公式连接了五个最重要的数学常数：
- $e$ (自然对数的底)
- $i$ (虚数单位)
- $\pi$ (圆周率)
- $1$ (乘法单位)
- $0$ (加法单位)

## 应用

在信号处理中，我们经常使用 $e^{i\omega t}$ 来表示复指数信号。
```

---

**提示**: 数学公式功能已集成到所有笔记编辑器中，无需额外配置！
