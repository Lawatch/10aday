/* 10aday — mode « intégré » des calculateurs (iframe sur un site tiers).
 * Activé par le paramètre ?integre=1 dans l'URL de la page. Sans ce paramètre : ne fait rien.
 * À charger dans <head>, AVANT le script GoatCounter (il règle window.goatcounter).
 * - n'affiche que le titre, le formulaire, le résultat et l'avertissement ;
 * - ouvre tous les liens dans un nouvel onglet (jamais de navigation dans l'iframe) ;
 * - ajoute un lien de crédit visible vers la page complète ;
 * - demande aux moteurs de ne pas indexer cette variante (la page complète reste la référence) ;
 * - compte la vue GoatCounter sous « <chemin>integre/ » (le référent = le site hôte) ;
 * - envoie sa hauteur au site hôte (postMessage) pour que l'iframe s'ajuste (script hote.js).
 */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  if (params.get('integre') !== '1') return;

  var html = document.documentElement;
  html.classList.add('integre');
  // GoatCounter : par défaut il ne compte pas dans une iframe → allow_frame.
  window.goatcounter = window.goatcounter || {};
  window.goatcounter.allow_frame = true;
  window.goatcounter.path = function (p) { return p.replace(/\/?$/, '/') + 'integre/'; };

  var head = document.head;
  var meta = document.querySelector('meta[name="robots"]');
  if (!meta) { meta = document.createElement('meta'); meta.name = 'robots'; head.appendChild(meta); }
  meta.content = 'noindex, follow';
  var base = document.createElement('base');
  base.target = '_blank';
  head.appendChild(base);
  var style = document.createElement('style');
  style.textContent =
    'html.integre body{max-width:none;margin:0;padding:.6rem .8rem .4rem;background:#fff}' +
    'html.integre body>*{display:none}' +
    'html.integre body>h1,html.integre body>form,html.integre body>section#result:not([hidden]),' +
    'html.integre body>p.note.keep,html.integre body>p.credit10{display:block}' +
    'html.integre body>h1{font-size:1.15rem;margin:.1rem 0 .4rem}' +
    'html.integre form{margin:.5rem 0}' +
    'html.integre #share,html.integre #shared{display:none!important}' +
    'html.integre p.note{font-size:.85rem}' +
    'html.integre p.credit10{font-size:.8rem;color:#555;margin:.6rem 0 0;border-top:1px solid #dde3ea;padding-top:.4rem}';
  head.appendChild(style);

  function canonical() {
    var c = document.querySelector('link[rel="canonical"]');
    return c ? c.href : location.origin + location.pathname;
  }

  function hauteur() {
    var h = Math.ceil(document.body.getBoundingClientRect().height) + 4;
    if (window.parent !== window) {
      window.parent.postMessage({ type: '10aday:hauteur', h: h, page: canonical() }, '*');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    // La balise robots de la page est lue après ce script : on la neutralise ici.
    var ms = document.querySelectorAll('meta[name="robots"]');
    for (var i = 0; i < ms.length; i++) ms[i].content = 'noindex, follow';
    var res = document.getElementById('result');
    // Premier avertissement « Résultat indicatif » placé après le résultat.
    var n = res ? res.nextElementSibling : null;
    while (n && !(n.tagName === 'P' && n.classList.contains('note'))) n = n.nextElementSibling;
    if (n) n.classList.add('keep');

    var p = document.createElement('p');
    p.className = 'credit10';
    var a = document.createElement('a');
    a.href = canonical();
    a.textContent = 'explications détaillées, exemples et sources officielles';
    p.appendChild(document.createTextNode('Calculateur gratuit fourni par 10aday, outil construit par des agents IA. Calcul fait dans votre navigateur, rien n’est envoyé. Voir les '));
    p.appendChild(a);
    p.appendChild(document.createTextNode('.'));
    document.body.appendChild(p);

    hauteur();
    if (window.ResizeObserver) new ResizeObserver(hauteur).observe(document.body);
    else setInterval(hauteur, 500);
  });
})();
