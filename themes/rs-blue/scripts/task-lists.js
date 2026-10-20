/* Obsidian / GFM 任务列表：`- [ ]` 与 `- [x]` 渲染成真正的复选框；
   勾选（x / X）时该行文字加删除线并转灰 —— 与 Obsidian 阅读视图的表现一致。

   为什么自写：markdown-it 13 核心不含 GFM task list；而现成插件
   （markdown-it-task-lists）只补复选框、不带「勾选整行划线」的联动，
   且本项目渲染器被锁在 13（见 docs/HANDOFF.md §6.1）。
   这里沿用 wikilink.js 的入口 —— hexo-renderer-markdown-it 暴露的
   `markdown-it:renderer` 过滤器，在 inline 解析之后改 token：

     · 列表项第一个段落以 `[ ]` / `[x]` / `[X]` 开头时，标记换成
       <input class="task-checkbox" type="checkbox" disabled>
     · 该 <li> 加 class `task-list-item`，勾选的再加 `is-checked`
     · 勾选时把该行剩余行内内容包进 <s>（由 markdown-it 既有的
       s_open / s_close 渲染器规则输出），只影响这一行，不波及嵌套子项

   嵌套（套娃）：规则按 list_item 逐个判定，嵌套任务列表各层独立；
   Callout `> [!todo]` 与 `::: collapse` 内的任务列表，由 obsidian-blocks.js
   递归剥层后仍交回 markdown-it 渲染，因此同样生效。 */

const MARKER = /^\[([ xX])\][ \t\u00a0]*/;

function taskListPlugin(md) {
  // 渲染器实例在进程内复用，而 markdown-it:renderer 过滤器每次渲染都会跑，
  // 这里保证规则只注册一次。
  if (md.__rsBlueTaskList) return;
  md.__rsBlueTaskList = true;

  md.core.ruler.after('inline', 'rs_blue_task_list', function (state) {
    const tokens = state.tokens;
    const Token = state.Token;

    for (let i = 2; i < tokens.length; i++) {
      // 只认「列表项的第一个段落」里的行内内容
      if (tokens[i].type !== 'inline') continue;
      if (tokens[i - 1].type !== 'paragraph_open') continue;
      if (tokens[i - 2].type !== 'list_item_open') continue;

      const children = tokens[i].children;
      if (!children || !children.length) continue;
      const first = children[0];
      if (!first || first.type !== 'text') continue;

      const marker = MARKER.exec(first.content);
      if (!marker) continue;

      const checked = marker[1] !== ' ';
      const item = tokens[i - 2];
      item.attrJoin('class', checked ? 'task-list-item is-checked' : 'task-list-item');

      const rest = first.content.slice(marker[0].length);
      const checkbox = new Token('html_inline', '', 0);
      checkbox.content = '<input class="task-checkbox" type="checkbox" disabled' + (checked ? ' checked' : '') + '>';
      const text = new Token('text', '', 0);
      text.content = rest;

      // 用「复选框（+ 剩余文字）」替换原来的首段文本 token
      if (rest) children.splice(0, 1, checkbox, text);
      else children.splice(0, 1, checkbox);

      // 勾选：把该行剩余内容包进 <s>，行级删除线
      if (checked && children.length > 1) {
        children.splice(1, 0, new Token('s_open', 's', 1));
        children.push(new Token('s_close', 's', -1));
      }
    }
  });
}

hexo.extend.filter.register('markdown-it:renderer', function (md) {
  md.use(taskListPlugin);
});
