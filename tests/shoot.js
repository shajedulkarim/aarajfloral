// Usage: node tests/shoot.js <url> <out.png> <width> <height> [fullPage=1] [mock=1]
const puppeteer = require('/Users/shajedulkarim/aarajtools/node_modules/puppeteer-core');
const fs = require('fs'), path = require('path');
const [url, out, w, h, full = '1', mock = '0'] = process.argv.slice(2);
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
  if (mock === '1') await require('./harness').install(p);
  p.on('console', m => { if (m.type() === 'error') console.log('console.error:', m.text()); });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto(url, { waitUntil: 'networkidle0' });
  await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,150));}await Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r;})));window.scrollTo(0,0);});
  await new Promise(r => setTimeout(r, 800));
  await p.screenshot({ path: out, fullPage: full === '1' });
  await b.close();
})();
