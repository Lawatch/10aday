/* 10aday — à placer sur le site qui intègre un calculateur (facultatif).
 * Ajuste la hauteur des <iframe data-10aday> à leur contenu. Sans ce script, l'iframe garde sa hauteur fixe. */
(function () {
  'use strict';
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://lawatch.github.io') return;
    var d = e.data;
    if (!d || d.type !== '10aday:hauteur' || typeof d.h !== 'number') return;
    var f = document.querySelectorAll('iframe[data-10aday]');
    for (var i = 0; i < f.length; i++) {
      if (f[i].contentWindow === e.source) f[i].style.height = Math.max(200, Math.min(d.h, 4000)) + 'px';
    }
  });
})();
