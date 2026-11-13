const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const DOCS = '/home/user/10aday/docs';
const slugs = ['rupture-conventionnelle-dates','rupture-conventionnelle-indemnite','indemnite-conges-payes-depart','rupture-conventionnelle-impot-csg','chomage-rupture-conventionnelle','delais-contestation-rupture'];
const unesc = s => s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&amp;/g,'&');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext();
  const errs = [];
  let gc = 0;
  await ctx.route('**/*', async r => {
    const u = new URL(r.request().url());
    if (u.hostname === 'gc.zgo.at' || u.hostname.endsWith('goatcounter.com')) { gc++; return r.abort(); }
    if (u.hostname === 'lawatch.github.io') {
      let p = path.join(DOCS, u.pathname.replace(/^\/10aday\//, ''));
      if (p.endsWith('/')) p += 'index.html';
      if (!fs.existsSync(p)) return r.fulfill({ status: 404, body: 'nf' });
      const ct = p.endsWith('.js') ? 'application/javascript' : 'text/html; charset=utf-8';
      return r.fulfill({ status: 200, contentType: ct, body: fs.readFileSync(p) });
    }
    if (u.hostname === 'hote.example') {
      const snip = fs.readFileSync(DOCS + '/integrer/index.html', 'utf8');
      const codes = [...snip.matchAll(/<textarea[^>]*>([\s\S]*?)<\/textarea>/g)].map(m => unesc(m[1]));
      return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><body><h1>Blog RH</h1>' + codes.join('\n<hr>\n') + '</body></html>' });
    }
    return r.abort();
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('host: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto('https://hote.example/');
  await page.waitForTimeout(2000);
  const frames = await page.$$('iframe[data-10aday]');
  console.log('iframes', frames.length);
  for (let i = 0; i < frames.length; i++) {
    await frames[i].scrollIntoViewIfNeeded(); await page.waitForTimeout(600); // iframes en loading=lazy
    const f = await frames[i].contentFrame();
    const info = await f.evaluate(() => {
      const vis = [...document.body.children].filter(e => getComputedStyle(e).display !== 'none').map(e => e.tagName + (e.id ? '#' + e.id : '') + (e.className ? '.' + e.className : ''));
      return { vis, robots: document.querySelector('meta[name=robots]') && document.querySelector('meta[name=robots]').content, base: document.querySelector('base') && document.querySelector('base').target,
        gcpath: window.goatcounter && window.goatcounter.path(location.pathname), frame: window.goatcounter && window.goatcounter.allow_frame,
        credit: document.querySelector('p.credit10 a') && document.querySelector('p.credit10 a').href };
    });
    const h = await frames[i].evaluate(e => e.style.height);
    console.log(slugs[i], JSON.stringify(info), 'height', h);
  }
  const f0 = await frames[0].contentFrame();
  const h0 = await frames[0].evaluate(e => e.style.height);
  await f0.fill('#signature', '2026-11-02');
  await f0.click('button[type=submit]');
  await page.waitForTimeout(800);
  const txt = await f0.textContent('#timeline');
  const h1 = await frames[0].evaluate(e => e.style.height);
  console.log('dates timeline:', txt.replace(/\s+/g, ' ').slice(0, 400));
  console.log('hauteur', h0, '->', h1);
  console.log('result display', await f0.evaluate(() => getComputedStyle(document.getElementById('result')).display), 'share', await f0.evaluate(() => getComputedStyle(document.getElementById('share')).display));
  const links = await f0.$$eval('#result a', as => as.map(a => a.href + ' target=' + (a.target || document.querySelector('base').target)));
  console.log('liens résultat', links);
  await frames[2].scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
  await frames[2].screenshot({ path: require('os').tmpdir() + '/iccp.png' });
  console.log('robots metas', await f0.$$eval('meta[name=robots]', m => m.map(x => x.content)));
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push('normal: ' + e.message));
  await p2.goto('https://lawatch.github.io/10aday/rupture-conventionnelle-dates/');
  console.log('normal: crumb', await p2.evaluate(() => getComputedStyle(document.querySelector('nav.crumb')).display), 'robots', await p2.evaluate(() => !!document.querySelector('meta[name=robots]')), 'gc', await p2.evaluate(() => typeof window.goatcounter));
  const p3 = await ctx.newPage(); p3.on('pageerror', e => errs.push('integrer: ' + e.message));
  await p3.goto('https://lawatch.github.io/10aday/integrer/');
  await p3.waitForTimeout(1500);
  console.log('integrer: textarea', await p3.$$eval('textarea', t => t.length), 'demo height', await p3.$eval('iframe.demo', e => e.style.height));
  await p3.screenshot({ path: require('os').tmpdir() + '/integrer.png' });
  await page.screenshot({ path: require('os').tmpdir() + '/hote.png', fullPage: true });
  console.log('errors', errs, 'requêtes goatcounter bloquées', gc);
  await b.close();
})();
