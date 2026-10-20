/* 生成「分类总览」/「标签总览」页面。
   Hexo 自带的 hexo-generator-category / -tag 只生成每个分类/标签各自的页面，
   不会生成 categories/index.html 与 tags/index.html，所以这里补上。 */

// 按文章数降序，同数按名称排序，避免输出 Hexo 内部的插入序
function sortTerms(list) {
  return list.slice().sort(function (a, b) {
    return (b.length - a.length) || a.name.localeCompare(b.name);
  });
}

hexo.extend.generator.register('term_index', function (locals) {
  const out = [];

  const cats = locals.categories.filter(function (c) { return c.length > 0; });
  if (cats.length) {
    out.push({
      path: 'categories/index.html',
      layout: 'categories',
      data: { title: '分类', terms: sortTerms(cats.toArray()) }
    });
  }

  const tags = locals.tags.filter(function (t) { return t.length > 0; });
  if (tags.length) {
    out.push({
      path: 'tags/index.html',
      layout: 'tags',
      data: { title: '标签', terms: sortTerms(tags.toArray()) }
    });
  }

  return out;
});
