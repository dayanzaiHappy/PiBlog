---
title: 语法速查：本站支持的全部写法
date: 2026-10-20 11:00:00
categories:
  - 建站
tags:
  - Hexo
  - Markdown
  - Obsidian
---

这篇示例覆盖了本站正文支持的全部扩展写法，方便以后照着写。基础 Markdown（标题、**加粗**、*斜体*、[链接](https://hexo.io/)、列表、引用）就不重复演示了。

## 一、图表：两种写法

**写法 A：引用外部 SVG 文件**（复杂图表用这种，文件可复用、可单独维护）。注意图片下一行紧跟的 `*题注*` 会被并入卡片底部：

![图 1](charts/rs-flow.svg)

*图 1　博客写作与发布流程（外部 SVG 文件写法）*

**写法 B：正文直写内联 SVG**（简单图示用这种，一处写完）。注意 SVG 内部不要留空行：

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 60"><rect x="0" y="0" width="420" height="60" fill="#ffffff"></rect><rect x="8" y="14" width="96" height="32" rx="6" fill="#f2f7fc" stroke="#d8e3ee"></rect><text x="56" y="34" text-anchor="middle" font-size="13" fill="#0d2b45" font-family="Microsoft YaHei, sans-serif">.md</text><path d="M112 30 H150" stroke="#17a2a2" stroke-width="2.4" fill="none"></path><rect x="150" y="14" width="112" height="32" rx="6" fill="#f2f7fc" stroke="#d8e3ee"></rect><text x="206" y="34" text-anchor="middle" font-size="13" fill="#0d2b45" font-family="Microsoft YaHei, sans-serif">Hexo</text><path d="M270 30 H308" stroke="#17a2a2" stroke-width="2.4" fill="none"></path><rect x="308" y="14" width="104" height="32" rx="6" fill="#f2f7fc" stroke="#d8e3ee"></rect><text x="360" y="34" text-anchor="middle" font-size="13" fill="#0d2b45" font-family="Microsoft YaHei, sans-serif">HTML</text></svg>

两种写法都会被统一包成白底卡片；只要给外部图片补一行题注，就会自动带上底部题注条。

## 二、数学公式

行内公式用单个美元符号，例如质能方程 $E = mc^2$，以及高斯分布的概率密度 $f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}$。

独立成行的公式用两个美元符号：

$$
\hat{y} = \operatorname{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V
$$

## 三、Obsidian 语法

> [!note] 提示框（callout）
> 以 `> [!note]` 开头即可，正文继续用 `>` 引导。
> 支持 `note / tip / warning / danger / important` 等类型，各自有不同的强调色。

> [!tip]- 默认折叠的提示框
> 在类型后面加 `-`，这个框默认是收起的，点标题才展开。
>
> 适合放“剧透”性质的内容，例如推导细节或长注释。

行内高亮用两个等号：==这里是被高亮标记的句子==，适合划重点。

站内双链用双方括号，目标写文章标题或文件名（slug）都可以：参见 [[Hello World]]；用竖线还能自定义显示文字，例如 [[Hello World|上一篇随笔]]。

## 四、折叠

**折叠块语法糖**（推荐，内部照常写 Markdown）：

::: collapse 点开看：这段内容的完整推导
折叠块内部是正常的 Markdown，可以放列表：

1. 第一步：先把数据归一化；
2. 第二步：再做特征提取；
3. 第三步：最后做分类或检测。

也可以放公式：$a^2 + b^2 = c^2$。
:::

**原生 HTML 写法**（更灵活，可自定义属性）——`<details>` 与内容之间要留空行，内容才能被当作 Markdown 解析：

<details class="fold" open>
<summary>点开看：原生 details 写法</summary>

这里依然是 Markdown 段落，**加粗**、`行内代码`、[链接](https://hexo.io/) 都正常。

</details>

**代码块折叠**：超过 24 行的代码块会自动收起，并在上方出现「展开全部」按钮，见下面第六节。

## 五、代码块

带文件名标题的代码块用 Hexo 的 `codeblock` 标签（标题会被渲染成代码块的表头）：

{% codeblock 归一化示例.py lang:python %}
import numpy as np


def min_max_scale(band: np.ndarray, eps: float = 1e-8) -> np.ndarray:
    """把单波段影像拉伸到 0~1。"""
    low, high = np.percentile(band, [2, 98])
    return np.clip((band - low) / (high - low + eps), 0.0, 1.0)
{% endcodeblock %}

普通围栏代码块（无标题）直接写三反引号即可，行号由主题自动加上：

```javascript
const posts = hexo.locals.get('posts').toArray();

function findByTitle(title) {
  return posts.find((post) => post.title === title);
}

console.log(findByTitle('Hello World').path);
```

下面这段超过 24 行，会自动折叠——注意它上面的「展开全部」按钮：

```javascript
// 一段刻意写长的代码，用来演示长代码块自动折叠阈值（24 行）
const pipeline = [
  'load-image',
  'radiometric-calibration',
  'atmospheric-correction',
  'geometric-correction',
  'cloud-mask',
  'resample',
  'tile',
  'normalize',
  'augment',
  'build-model',
  'train',
  'validate',
  'quantize',
  'export-onnx',
  'serve',
];

function runPipeline(steps, ctx) {
  const trace = [];
  for (const step of steps) {
    const started = Date.now();
    const out = ctx.execute(step);
    trace.push({
      step,
      ok: out !== null && out !== undefined,
      ms: Date.now() - started,
    });
    if (!trace[trace.length - 1].ok) {
      throw new Error('步骤失败：' + step);
    }
  }
  return trace;
}

function summarize(trace) {
  const total = trace.reduce((sum, item) => sum + item.ms, 0);
  return {
    steps: trace.length,
    totalMs: total,
    slowest: trace.slice().sort((a, b) => b.ms - a.ms)[0],
  };
}

const trace = runPipeline(pipeline, { execute: (step) => step });
console.log(summarize(trace));
```

代码块右上角有「复制」按钮；行号在左侧独立一列，不会被复制进去。

## 六、表格

**表 1　本站正文功能一览**

| 功能 | 写法 | 说明 |
| --- | --- | --- |
| 数学公式 | `$…$` / `$$…$$` | KaTeX 渲染，离线可用 |
| 提示框 | `> [!note] 标题` | 类型后面加 `-` 则默认折叠 |
| 高亮 | `==文字==` | 马克笔效果 |
| 双链 | `[[文章标题]]` | 按标题或 slug 匹配站内文章 |
| 折叠块 | `::: collapse 标题` | 内部照常写 Markdown |
| 外部图表 | `![图](charts/x.svg)` | 下一行 `*题注*` 会并入卡片 |

> [!warning] 关于 HTML 直写
> 本站正文开启了 HTML 透传，所以可以直接写 `<svg>`、`<details>` 等标签。
> 但注意：**HTML 块内部不要出现空行**，否则 Markdown 解析会在那里断掉。
