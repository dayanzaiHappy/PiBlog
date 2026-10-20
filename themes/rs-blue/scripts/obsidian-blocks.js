/* Obsidian 风格块的预处理（before_post_render）。
   两种写法，都渲染成原生 <details>，因此天然带折叠能力：

     1) 提示框（callout）
        > [!note] 标题
        > 正文（markdown）
        > [!note]- 标题  →  默认折叠
        > [!note]+ 标题  →  默认展开（也是默认行为）

     2) 折叠块
        ::: collapse 标题
        正文（markdown）
        :::

   类型与配色对齐 Obsidian 官方 Callout（13 个类型 + 各自别名，每类唯一图标/配色/默认标题）。
   图标取 Lucide 官方路径数据（内联 SVG，离线可用、无额外请求），颜色由 CSS 的 --callout-rgb 驱动。

   嵌套：正文剥掉一层 `> ` 后**递归**处理，因此 callout 内 callout / callout 内 ::: collapse /
   collapse 内 callout 都能逐层转换（深度上限 MAX_DEPTH 防病态输入）。

   为什么不用现成插件：hexo-renderer-markdown-it 固定使用 markdown-it 13，
   而主流 callout 插件（如 markdown-it-obsidian-callouts）的 peer 要求 markdown-it ^14；
   而 markdown-it-container 又无法通过 _config.yml 的 plugins 列表传入容器名。
   这里自带实现可完全规避版本与配置限制。

   实现要点：<details> / <summary> / <div> 都在 CommonMark 的「块级 HTML 标签」名单内，
   所以生成的 HTML 之间必须留空行，markdown-it 才会把空行之后的内容继续当 markdown 解析；
   闭合标签单独成行（HTML block type 7）即被原样透传。
   正文统一包在 <div class="details-body"> 里（缩进只加一次，见 content-extras.css）。 */

const MAX_DEPTH = 10;

// 主类型 → 默认标题（中文）/ 官方配色 rgb / Lucide 图标内容
const CALLOUT_META = {
  note: {
    title: '笔记', rgb: '8,109,221',
    icon: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497zM15 5l4 4"/>'
  },
  abstract: {
    title: '摘要', rgb: '0,191,188',
    icon: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2m4 7h4m-4 5h4m-8-5h.01M8 16h.01"/></g>'
  },
  info: {
    title: '信息', rgb: '8,109,221',
    icon: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></g>'
  },
  todo: {
    title: '待办', rgb: '8,109,221',
    icon: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11l3 3L22 4"/></g>'
  },
  tip: {
    title: '提示', rgb: '0,191,188',
    icon: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0a5 5 0 0 1 1-3a1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/>'
  },
  success: {
    title: '成功', rgb: '8,185,78',
    icon: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"/>'
  },
  question: {
    title: '疑问', rgb: '236,117,0',
    icon: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01"/></g>'
  },
  warning: {
    title: '警告', rgb: '236,117,0',
    icon: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4m0 4h.01"/>'
  },
  failure: {
    title: '失败', rgb: '233,49,71',
    icon: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/>'
  },
  danger: {
    title: '危险', rgb: '233,49,71',
    icon: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.914 4a1.5 1.5 0 0 0-2.474-1.561l-9 9A1.5 1.5 0 0 0 5.5 14h4.002a.5.5 0 0 1 .471.666L8.086 20a1.5 1.5 0 0 0 2.475 1.56l9-9A1.5 1.5 0 0 0 18.5 10h-3.997a.5.5 0 0 1-.472-.667z"/>'
  },
  bug: {
    title: '缺陷', rgb: '233,49,71',
    icon: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 20v-9m2-4a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4zm.12-3.12L16 2"/><path d="M21 21a4 4 0 0 0-3.81-4M21 5a4 4 0 0 1-3.55 3.97M22 13h-4M3 21a4 4 0 0 1 3.81-4M3 5a4 4 0 0 0 3.55 3.97M6 13H2M8 2l1.88 1.88M9 7.13V6a3 3 0 1 1 6 0v1.13"/></g>'
  },
  example: {
    title: '示例', rgb: '120,82,238',
    icon: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h.01M3 12h.01M3 19h.01M8 5h13M8 12h13M8 19h13"/>'
  },
  quote: {
    title: '引用', rgb: '158,158,158',
    icon: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1a6 6 0 0 0 6-6V5a2 2 0 0 0-2-2zM5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1a6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>'
  }
};

// 别名 → 主类型（与 Obsidian 官方一致）
const CALLOUT_ALIAS = {
  summary: 'abstract', tldr: 'abstract',
  hint: 'tip', important: 'tip',
  check: 'success', done: 'success',
  help: 'question', faq: 'question',
  caution: 'warning', attention: 'warning',
  fail: 'failure', missing: 'failure',
  error: 'danger',
  cite: 'quote'
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CALLOUT_START = /^ {0,3}>\s*\[!([A-Za-z][\w-]*)\]([+-]?)\s*(.*)$/;
const CALLOUT_LINE = /^ {0,3}>\s?/;
const COLLAPSE_START = /^ {0,3}:::\s*collapse(-|\+)?\s*(.*)$/;
const COLLAPSE_END = /^ {0,3}:::\s*$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

// 把折叠块 / 提示框的正文统一包进一个内容容器：缩进只加一次（配合 content-extras.css）
function bodyBlock(innerHtml) {
  if (!innerHtml) return [];
  return ['<div class="details-body">', '', innerHtml, '', '</div>', ''];
}

function transform(content, depth) {
  depth = depth || 0;
  const lines = content.split(/\r?\n/);
  const out = [];
  let fence = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 代码围栏内的内容原样保留（避免把示例代码里的 ::: / [!note] 也转换掉）
    if (fence) {
      out.push(line);
      if (line.trim().startsWith(fence)) fence = null;
      i++;
      continue;
    }
    const fenceMatch = FENCE.exec(line);
    if (fenceMatch) {
      fence = fenceMatch[1];
      out.push(line);
      i++;
      continue;
    }

    // ---- 提示框 ----
    const callout = CALLOUT_START.exec(line);
    if (callout) {
      const rawType = callout[1].toLowerCase();
      const modifier = callout[2];
      const customTitle = callout[3].trim();
      // 未识别的类型回落为 note（配色/图标），标题保留用户输入的原文
      const primary = CALLOUT_ALIAS[rawType] || (CALLOUT_META[rawType] ? rawType : 'note');
      const meta = CALLOUT_META[primary];
      const title = customTitle || meta.title || rawType;

      const body = [];
      i++;
      while (i < lines.length && CALLOUT_LINE.test(lines[i])) {
        body.push(lines[i].replace(CALLOUT_LINE, ''));
        i++;
      }

      const inner = body.join('\n').trim();
      const innerHtml = (depth >= MAX_DEPTH || !inner) ? inner : transform(inner, depth + 1);

      out.push(
        `<details class="callout callout-${primary}"${modifier === '-' ? '' : ' open'}>`,
        `<summary class="callout-title"><svg class="callout-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${meta.icon}</svg><span class="callout-title-text">${escapeHtml(title)}</span></summary>`,
        ''
      );
      out.push(...bodyBlock(innerHtml));
      out.push('</details>', '');
      continue;
    }

    // ---- 折叠块 ----
    const collapse = COLLAPSE_START.exec(line);
    if (collapse) {
      const modifier = collapse[1] || '';
      const title = collapse[2].trim() || '展开查看';
      const body = [];
      i++;
      while (i < lines.length && !COLLAPSE_END.test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // 跳过收尾的 :::

      const inner = body.join('\n').trim();
      const innerHtml = (depth >= MAX_DEPTH || !inner) ? inner : transform(inner, depth + 1);

      out.push(
        `<details class="collapse fold"${modifier === '-' ? '' : ' open'}>`,
        `<summary class="collapse-title">${escapeHtml(title)}</summary>`,
        ''
      );
      out.push(...bodyBlock(innerHtml));
      out.push('</details>', '');
      continue;
    }

    out.push(line);
    i++;
  }

  return out.join('\n');
}

hexo.extend.filter.register('before_post_render', function (data) {
  if (typeof data.content !== 'string') return data;
  if (data.content.indexOf('[!') === -1 && data.content.indexOf(':::') === -1) return data;
  data.content = transform(data.content, 0);
  return data;
});
