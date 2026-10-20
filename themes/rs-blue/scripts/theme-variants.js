/* 构建时主题切换（内容主题维度）。
   「内容主题」= 只负责文章内排版的 CSS（如 RS_BLUE），与站点骨架（site.css）解耦。
   取值来源：主题 _config.yml 的 content_theme，可被站点 _config.yml 的 theme_config 覆盖：
       theme_config:
         content_theme: RS_BLUE
   模板里这样用：
       <link rel="stylesheet" href="<%- url_for(content_theme_path()) %>">
   新增主题 = 往 themes/rs-blue/source/css/themes/ 里放一个新的 <NAME>.css。 */
function resolveThemeName(ctx) {
  var fromLocals = ctx && ctx.theme && ctx.theme.content_theme;
  if (fromLocals) return fromLocals;
  var fromThemeConfig = hexo.theme && hexo.theme.config && hexo.theme.config.content_theme;
  return fromThemeConfig || 'RS_BLUE';
}

hexo.extend.helper.register('content_theme_name', function () {
  return resolveThemeName(this);
});

hexo.extend.helper.register('content_theme_path', function () {
  return '/css/themes/' + resolveThemeName(this) + '.css';
});

/* 首段摘要：取 HTML 中第一个 <p> 的纯文本（供列表摘要与 meta description 复用）。
   避免「拿整篇内容去标签」把后文的小标题 / 代码 / 图表文字也混进摘要。 */
hexo.extend.helper.register('first_paragraph', function (html, length) {
  var raw = String(html || '');
  var m = raw.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  var text = (m ? m[1] : raw).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  var n = length || 110;
  return text.length > n ? text.slice(0, n) + '…' : text;
});
