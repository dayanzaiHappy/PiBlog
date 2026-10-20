/* Obsidian 双链：[[文章标题]] / [[文章标题|显示文字]] / [[slug]]
   通过 hexo-renderer-markdown-it 暴露的 `markdown-it:renderer` 过滤器注册一条内联规则，
   目标按「文章标题」或「slug」匹配 hexo.locals 里的文章，解析成真实文章路径；
   匹配不到时不生成死链，退化为纯文本并给出构建警告。

   注意：这条规则注册在 'link' 之前，因此不会被 markdown 的链接/强调规则抢走；
   行内代码（反引号）规则更早执行，所以 `[[x]]` 写在代码里不会被转换。 */

function resolvePostPath(hexo, label) {
  const key = String(label).trim().toLowerCase();
  if (!key) return null;
  const posts = hexo.locals.get('posts');
  const list = posts && typeof posts.toArray === 'function' ? posts.toArray() : posts;
  if (!list) return null;
  for (let i = 0; i < list.length; i++) {
    const post = list[i];
    if ((post.title || '').toLowerCase() === key || (post.slug || '').toLowerCase() === key) {
      return post.path;
    }
  }
  return null;
}

function wikilinkPlugin(md, hexo) {
  // 站内链接必须走 url_for：它会套 config.root 并做 URL 编码，
  // 产出「/2026/10/20/hello-world/」这样的站内绝对路径。
  const url_for = hexo.extend.helper.get('url_for').bind(hexo);
  const OPEN_BRACKET = 0x5b; // [

  md.inline.ruler.before('link', 'obsidian_wikilink', function (state, silent) {
    const src = state.src;
    const pos = state.pos;
    if (src.charCodeAt(pos) !== OPEN_BRACKET || src.charCodeAt(pos + 1) !== OPEN_BRACKET) return false;

    const end = src.indexOf(']]', pos + 2);
    if (end === -1) return false;

    const inner = src.slice(pos + 2, end);
    if (inner.indexOf('[') !== -1 || inner.indexOf('\n') !== -1) return false;

    let target = inner;
    let text = inner;
    const pipe = inner.indexOf('|');
    if (pipe !== -1) {
      target = inner.slice(0, pipe);
      text = inner.slice(pipe + 1);
    }
    target = target.trim();
    text = (text.trim() || target);

    const href = resolvePostPath(hexo, target);

    if (!silent) {
      if (!href) {
        hexo.log.debug(`[rs-blue] 双链未匹配到文章：[[${target}]]`);
        const fallback = state.push('text', '', 0);
        fallback.content = text;
      } else {
        const open = state.push('link_open', 'a', 1);
        open.attrs = [['href', url_for(href)], ['class', 'wikilink']];
        const label = state.push('text', '', 0);
        label.content = text;
        state.push('link_close', 'a', -1);
      }
    }

    state.pos = end + 2;
    return true;
  });
}

hexo.extend.filter.register('markdown-it:renderer', function (md) {
  md.use(wikilinkPlugin, hexo);
});
