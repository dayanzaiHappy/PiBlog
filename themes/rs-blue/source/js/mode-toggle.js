/* 亮/暗模式切换（运行时）。
   模式值写在 <html data-mode="light|dark">，持久化到 localStorage: piblog-mode。
   首屏的初始值已由 head.ejs 里的内联脚本提前设定，避免闪白（FOUC）。 */
(function () {
  var KEY = 'piblog-mode';

  function currentMode() {
    return document.documentElement.getAttribute('data-mode') === 'dark' ? 'dark' : 'light';
  }

  function applyMode(mode) {
    document.documentElement.setAttribute('data-mode', mode);
    try { window.localStorage.setItem(KEY, mode); } catch (e) { /* 隐私模式忽略 */ }
    var dark = mode === 'dark';
    document.querySelectorAll('.mode-toggle').forEach(function (btn) {
      btn.classList.toggle('is-dark', dark);
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      btn.setAttribute('title', dark ? '切换到亮色模式' : '切换到暗色模式');
      btn.setAttribute('aria-label', dark ? '切换到亮色模式' : '切换到暗色模式');
    });
  }

  function init() {
    var mode = currentMode();
    document.querySelectorAll('.mode-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        mode = currentMode() === 'dark' ? 'light' : 'dark';
        applyMode(mode);
      });
    });
    applyMode(mode);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
