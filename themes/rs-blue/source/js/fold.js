/* 长代码块自动折叠：超过阈值的代码块默认收起，并在其上方加一个「展开 / 收起」按钮。
   与 :: collapse 的折叠块是两套机制：这里不改变 DOM 结构，只加 class + 按钮。 */
(function () {
  var LINE_THRESHOLD = 24;

  function countLines(figure) {
    var cell = figure.querySelector('td.code') || figure;
    return cell.querySelectorAll('.line').length;
  }

  function makeToggle(figure, count) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'fold-toggle';
    button.textContent = '展开全部（' + count + ' 行）';
    button.addEventListener('click', function () {
      var folded = figure.classList.toggle('is-folded');
      button.textContent = folded ? ('展开全部（' + count + ' 行）') : '收起代码';
    });
    figure.parentNode.insertBefore(button, figure);
  }

  function init() {
    document.querySelectorAll('#write figure.highlight').forEach(function (figure) {
      if (figure.classList.contains('is-folded')) return;
      var count = countLines(figure);
      if (count <= LINE_THRESHOLD) return;
      figure.classList.add('is-folded');
      makeToggle(figure, count);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
