/* 给每个代码块加「复制」按钮（配合 content-extras.css 的 .code-copy 样式）。
   Hexo 的 highlight 结构是 figure.highlight > table > td.code > pre，正文取 td.code 即可。 */
(function () {
  function codeTextOf(figure) {
    var cell = figure.querySelector('td.code') || figure;
    var text = cell.innerText || cell.textContent || '';
    return text.replace(/[ \t]+$/, '').replace(/\s+$/, '');
  }

  function legacyCopy(text, done) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* 忽略 */ }
    document.body.removeChild(area);
  }

  function attach(figure) {
    if (figure.querySelector('.code-copy')) return;

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.textContent = '复制';
    button.setAttribute('aria-label', '复制这段代码');

    button.addEventListener('click', function () {
      var text = codeTextOf(figure);
      var done = function () {
        button.textContent = '已复制';
        button.classList.add('is-done');
        window.setTimeout(function () {
          button.textContent = '复制';
          button.classList.remove('is-done');
        }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { legacyCopy(text, done); });
      } else {
        legacyCopy(text, done);
      }
    });

    figure.appendChild(button);
  }

  function init() {
    document.querySelectorAll('#write figure.highlight').forEach(attach);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
