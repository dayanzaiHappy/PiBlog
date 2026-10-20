/* 把 SVG 统一包成 RS_BLUE 的白底图表卡片。处理两种写法（见计划 §2.3）：

     A. 引用外部文件：![图1](charts/x.svg) 紧随一行 *题注*
        → 在 after_post_render 阶段，把 <img src="….svg"> 内联成
          <figure class="chart chart-x"><svg>…</svg><figcaption>题注</figcaption></figure>

     B. 正文直写内联：<svg …>…</svg>
        → 在 before_post_render 阶段（源码层）就包成 <figure class="chart">…</figure>

   为什么 B 必须在源码层做：after_post_render 拿到的 HTML 里已经含有 KaTeX 渲染出来的
   内部 <svg>（根号横线、拉伸括号等），在 HTML 上做全局匹配会把它们也误包成卡片。
   在源码层处理，KaTeX 的产物压根还没生成，天然不会误伤。

   B 的实现要跳过代码围栏（否则代码示例里的 <svg> 也会被包）。 */

const fs = require('fs');
const path = require('path');

const EXTERNAL_SVG =
  /<p>\s*<img[^>]*?src="([^"]+\.svg)"[^>]*?\/?>\s*<\/p>\s*(?:<p>\s*<em>([\s\S]*?)<\/em>\s*<\/p>)?/gi;
const RAW_SVG_OPEN = /<svg\b/i;
const RAW_SVG_CLOSE = /<\/svg>/i;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
// 主题自己生成的 UI 图标（提示框标题里的 <svg class="callout-icon">）不是图表：
// 它由 obsidian-blocks.js 产出，而两个 before_post_render 过滤器的执行顺序不稳定，
// 这里显式跳过，避免图标被包成白底图表卡片。
const UI_ICON = /class="callout-icon"/i;

function stripXml(svg) {
  return String(svg)
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .trim();
}

function svgClass(stem) {
  if (!stem) return 'chart';
  return `chart chart-${stem.replace(/[^\w-]/g, '_')}`;
}

function buildFigure(svg, caption, stem) {
  const cap = caption && caption.trim() ? `<figcaption>${caption.trim()}</figcaption>` : '';
  return `<figure class="${svgClass(stem)}">\n${stripXml(svg)}\n${cap}\n</figure>`;
}

/* ============ 写法 B：源码层包装内联 <svg> ============ */
function wrapRawSvgSource(content) {
  const lines = content.split(/\r?\n/);
  const out = [];
  let fence = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (fence) {
      out.push(line);
      if (line.trim().startsWith(fence)) fence = null;
      continue;
    }
    const fenceMatch = FENCE.exec(line);
    if (fenceMatch) {
      fence = fenceMatch[1];
      out.push(line);
      continue;
    }
    if (!RAW_SVG_OPEN.test(line) || UI_ICON.test(line)) {
      out.push(line);
      continue;
    }

    // 收集到 </svg> 为止（SVG 可能跨多行）
    let chunk = line;
    while (!RAW_SVG_CLOSE.test(chunk) && i + 1 < lines.length) {
      i++;
      chunk += '\n' + lines[i];
    }

    // 若上一层已经是手写的 <figure>，就不再重复包裹
    let prev = out.length - 1;
    while (prev >= 0 && out[prev].trim() === '') prev--;
    const alreadyWrapped = prev >= 0 && /^<figure\b/i.test(out[prev].trim());

    if (alreadyWrapped || !RAW_SVG_CLOSE.test(chunk)) {
      out.push(chunk);
      continue;
    }

    out.push(chunk.replace(/(<svg\b[\s\S]*?<\/svg>)/i, function (svg) {
      return buildFigure(svg, '', '');
    }));
  }

  return out.join('\n');
}

/* ============ 写法 A：after_post_render 内联外部 SVG 文件 ============ */
function candidatePaths(hexo, data, src) {
  const clean = String(src).split(/[?#]/)[0];
  if (/^\//.test(clean)) {
    return [path.join(hexo.source_dir, clean.replace(/^\//, ''))];
  }

  const cands = [];
  const rawSource = data.full_source || data.source || '';
  if (rawSource) {
    const absSource = path.isAbsolute(rawSource)
      ? rawSource
      : (/^source[\\/]/.test(rawSource)
        ? path.join(hexo.base_dir, rawSource)
        : path.join(hexo.source_dir, rawSource));
    const postDir = path.join(path.dirname(absSource), path.basename(absSource, path.extname(absSource)));
    cands.push(path.join(postDir, clean)); // 文章资源目录 source/_posts/<name>/…
  }
  cands.push(path.join(hexo.source_dir, clean));
  cands.push(path.join(hexo.base_dir, clean));
  return cands;
}

function readSvg(hexo, data, src) {
  const cands = candidatePaths(hexo, data, src);
  for (let i = 0; i < cands.length; i++) {
    try {
      if (fs.existsSync(cands[i])) return fs.readFileSync(cands[i], 'utf8');
    } catch (err) { /* 读不到就试下一个 */ }
  }
  hexo.log.warn(`[rs-blue] 找不到 SVG 文件：${src}（已尝试：${cands.join(' , ')}）`);
  return null;
}

hexo.extend.filter.register('before_post_render', function (data) {
  if (typeof data.content === 'string' && RAW_SVG_OPEN.test(data.content)) {
    data.content = wrapRawSvgSource(data.content);
  }
  return data;
});

hexo.extend.filter.register('after_post_render', function (data) {
  if (typeof data.content !== 'string') return data;
  if (!/\.svg"/i.test(data.content)) return data;

  data.content = data.content.replace(EXTERNAL_SVG, function (matched, src, caption) {
    const svg = readSvg(hexo, data, src);
    if (!svg) return matched;
    return buildFigure(svg, caption || '', path.basename(src, path.extname(src)));
  });

  return data;
});
