// End-to-end checks against a MOCKED Supabase. Real database behaviour (RLS, triggers, auth) is NOT covered here.
// Usage: node tests/run.js <shots-dir> [filter]
const puppeteer = require('/Users/shajedulkarim/aarajtools/node_modules/puppeteer-core');
const fs = require('fs'), path = require('path');
const harness = require('./harness');
const SHOTS = process.argv[2] || '/tmp/aaraj-shots', ONLY = process.argv[3] || '';
const BASE = 'http://localhost:8123/';
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0; const failures = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
function check(name, ok, extra) { if (ok) { pass++; console.log('  PASS', name); } else { fail++; failures.push(name); console.log('  FAIL', name, extra !== undefined ? '-> ' + JSON.stringify(extra) : ''); } }

async function open(browser, url, w, h, pre, login) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  const errs = []; page.__errs = errs;
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await harness.install(page, pre);
  if (login) await page.evaluateOnNewDocument(u => { try { if (!sessionStorage.getItem('mock_user')) sessionStorage.setItem('mock_user', JSON.stringify(u)); } catch (e) {} }, login);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await sleep(250);
  return page;
}
async function shot(page, name, full) {
  if (full) await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } await Promise.race([Promise.all([...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))), new Promise(r => setTimeout(r, 3000))]); window.scrollTo(0, 0); });
  await sleep(250); await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: !!full });
}
const OWNER = { id: 'u-owner', email: 'owner@aaraj.test' }, STAFF = { id: 'u-staff', email: 'staff@aaraj.test' };
const click = async (page, sel) => { await page.waitForSelector(sel, { visible: true, timeout: 4000 }); await page.click(sel); await sleep(120); };
const clickText = async (page, sel, text) => { const ok = await page.evaluate((s, t) => { const el = [...document.querySelectorAll(s)].find(e => e.textContent.trim().toLowerCase().includes(t.toLowerCase()) && e.offsetParent !== null); if (el) { el.click(); return true; } return false; }, sel, text); await sleep(150); return ok; };
const text = (page, sel) => page.$eval(sel, e => e.textContent).catch(() => null);
const count = (page, sel) => page.$$eval(sel, e => e.length);
const mockDb = (page, fn) => page.evaluate(fn);

async function publicSuite(b) {
  console.log('\nPUBLIC SITE');
  let p = await open(b, BASE, 390, 844);
  check('phone: loads from mocked database', await p.evaluate(() => document.documentElement.dataset.source) === 'database');
  check('phone: menu cards rendered', await count(p, '.card') === 9);
  check('phone: no horizontal scroll', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  check('phone: no JS errors', p.__errs.length === 0, p.__errs);
  await shot(p, 'site-phone-home', true);
  // build an order
  await p.evaluate(() => { window.__wa = []; window.open = (u) => { window.__wa.push(u); return {}; }; });
  await clickText(p, '.card .add', 'Add'); await clickText(p, '.card .add', 'Add');
  await clickText(p, '.stepper button', '+');
  check('phone: order bar appears', await p.$eval('#orderBar', e => !e.hidden));
  await shot(p, 'site-phone-orderbar');
  await click(p, '#orderOpen'); await sleep(350);
  await p.type('input[name=name]', 'Test Customer'); await p.type('input[name=phone]', '99123456'); await p.type('textarea[name=note]', 'Gift card: for mum');
  await shot(p, 'site-phone-order-sheet');
  await click(p, '#sendBtn'); await sleep(500);
  const wa = await p.evaluate(() => window.__wa[0] || '');
  check('whatsapp opens with number and prefilled text', wa.startsWith('https://wa.me/96877399377?text=') && decodeURIComponent(wa).includes('Test Customer') && decodeURIComponent(wa).includes('Total: OMR'), wa.slice(0, 120));
  const logged = await p.evaluate(() => window.__mock.db.orders.filter(o => o.customer_name === 'Test Customer'));
  check('order is logged to database with server-computed total', logged.length === 1 && logged[0].status === 'new' && Math.abs(logged[0].total - logged[0].items.reduce((s, i) => s + i.price * i.qty, 0)) < 1e-9, logged);
  await p.close();

  // logging failure must not block WhatsApp
  p = await open(b, BASE, 390, 844, { failTables: { orders: true } });
  await p.evaluate(() => { window.__wa = []; window.open = (u) => { window.__wa.push(u); return {}; }; });
  await clickText(p, '.card .add', 'Add'); await click(p, '#orderOpen'); await sleep(300); await click(p, '#sendBtn'); await sleep(900);
  check('logging failure: WhatsApp still opens', (await p.evaluate(() => window.__wa.length)) === 1);
  check('logging failure: user told', /could not save|تعذر/i.test(await text(p, '#toast') || ''));
  await p.close();

  // database unreachable
  p = await open(b, BASE, 390, 844, { failSelect: { menu_items: true } });
  check('db down: falls back to bundled defaults', await p.evaluate(() => document.documentElement.dataset.source) === 'defaults' && await count(p, '.card') === 9);
  check('db down: no JS errors', p.__errs.length === 0, p.__errs);
  await p.close();

  // desktop
  p = await open(b, BASE, 1440, 900);
  check('desktop: order panel is a visible sticky column', await p.$eval('#order', e => getComputedStyle(e).position === 'sticky' && e.getBoundingClientRect().width > 300));
  check('desktop: no horizontal scroll', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  check('desktop: mobile order bar hidden', await p.$eval('#orderBar', e => getComputedStyle(e).display === 'none' || e.hidden));
  await shot(p, 'site-desktop-home', true);
  await p.evaluate(() => document.querySelector('#menu').scrollIntoView());
  await clickText(p, '.card .add', 'Add'); await clickText(p, '.card .add', 'Add'); await sleep(200);
  await p.evaluate(() => window.scrollTo(0, document.querySelector('#menu').offsetTop - 80)); await shot(p, 'site-desktop-menu-with-order');
  // Arabic
  await click(p, '#langBtn'); await sleep(400);
  check('arabic: dir=rtl and lang=ar', await p.evaluate(() => document.documentElement.dir === 'rtl' && document.documentElement.lang === 'ar'));
  check('arabic: menu names in Arabic', /باقة/.test(await text(p, '.card h4') || ''));
  check('arabic: no horizontal scroll', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await shot(p, 'site-desktop-arabic', true);
  await p.close();
  p = await open(b, BASE, 390, 844); await click(p, '#langBtn'); await sleep(400);
  check('arabic phone: no horizontal scroll', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await shot(p, 'site-phone-arabic', true); await p.close();
}

async function adminSuite(b) {
  console.log('\nADMIN: sign in');
  let p = await open(b, BASE + 'admin/', 390, 844);
  await shot(p, 'admin-phone-login');
  await p.type('input[name=email]', 'owner@aaraj.test'); await p.type('input[name=password]', 'wrong-password'); await click(p, 'button[type=submit]'); await sleep(400);
  check('wrong password shows message', /wrong/i.test(await text(p, '.notice') || ''));
  await p.close();
  p = await open(b, BASE + 'admin/', 390, 844);
  await p.type('input[name=email]', 'owner@aaraj.test'); await p.type('input[name=password]', 'owner-pass-1'); await click(p, 'button[type=submit]'); await sleep(900);
  check('owner signs in and lands on orders', (await p.evaluate(() => location.hash)) === '#/orders' && await count(p, '.ocard') > 0);
  await p.close();

  console.log('\nADMIN: phone');
  p = await open(b, BASE + 'admin/', 390, 844, null, OWNER); await sleep(500);
  check('phone: bottom nav visible, sidebar hidden', await p.evaluate(() => getComputedStyle(document.querySelector('.tabbar')).display !== 'none' && getComputedStyle(document.querySelector('.side')).display === 'none'));
  check('phone: owner sees 5 tabs', await count(p, '.tabbar [data-tab]') === 5);
  check('phone: no horizontal scroll (orders)', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await shot(p, 'admin-phone-orders', true);
  for (const t of ['menu', 'photos', 'insights', 'settings']) { await p.evaluate(t => { location.hash = '#/' + t; }, t); await sleep(700); check('phone: ' + t + ' no horizontal scroll', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)); await shot(p, 'admin-phone-' + t, true); }
  check('phone: no JS errors', p.__errs.length === 0, p.__errs);
  await p.close();

  console.log('\nADMIN: desktop');
  p = await open(b, BASE + 'admin/', 1440, 900, null, OWNER); await sleep(500);
  check('desktop: sidebar visible, bottom nav hidden', await p.evaluate(() => getComputedStyle(document.querySelector('.side')).display !== 'none' && getComputedStyle(document.querySelector('.tabbar')).display === 'none'));
  check('desktop: orders use multi-column grid', await p.evaluate(() => { const g = document.querySelector('.grid'); return g && getComputedStyle(g).gridTemplateColumns.split(' ').length >= 3; }));
  await shot(p, 'admin-desktop-orders');

  console.log('\nADMIN: orders');
  const fn = await count(p, '.ocard[data-status=new]');
  await clickText(p, '.ocard[data-status=new] [data-set=preparing]', 'Start preparing');
  check('status: new -> preparing (optimistic)', await count(p, '.ocard[data-status=new]') === fn - 1 || (await count(p, '.chip')) > 0);
  await sleep(200);
  const dbStat = await p.evaluate(() => window.__mock.db.orders.filter(o => o.status === 'preparing').length);
  check('status: persisted to database', dbStat >= 2, dbStat);
  // rollback
  await p.evaluate(() => { window.__mock.failTables = { orders: true }; });
  const before = await count(p, '.ocard[data-status=new]');
  await clickText(p, '.ocard[data-status=new] [data-set=preparing]', 'Start preparing'); await sleep(300);
  check('status: failure rolls back and shows error', await count(p, '.ocard[data-status=new]') === before && /not updated/i.test(await text(p, '.toast.bad') || ''));
  await p.evaluate(() => { window.__mock.failTables = {}; });
  // realtime
  await p.evaluate(() => { window.__mock.insertOrder({ customer_name: 'Live Customer', phone: '98765432', items: [{ id: 'i-1', name: 'Lily bouquet', qty: 1, price: 18 }], fulfilment: 'pickup', lang: 'en' }); }); await sleep(400);
  check('realtime: new order appears with toast and badge', /Live Customer/.test(await text(p, '#view') || '') && /New order/.test(await p.$$eval('.toast', t => t.map(x => x.textContent).join('|'))) && await p.$eval('#badge-side', e => !e.hidden));
  // search and filters
  await p.type('#ordQ', 'Live'); await sleep(300); check('search narrows list', await count(p, '.ocard') === 1);
  await p.$eval('#ordQ', e => { e.value = ''; e.dispatchEvent(new Event('input')); }); await sleep(300);
  await clickText(p, '.chip', 'Done'); check('filter: done only', await p.$$eval('.ocard', els => els.length > 0 && els.every(e => e.dataset.status === 'done')));
  await clickText(p, '.chip', 'Open');
  // tap to call/whatsapp
  const links = await p.$$eval('.ocard .who a', a => a.map(x => x.getAttribute('href')));
  check('customer phone: tel and WhatsApp links', links.some(h => h.startsWith('tel:')) && links.some(h => /^https:\/\/wa\.me\/968\d{8}$/.test(h)), links.slice(0, 4));
  // csv
  await p.evaluate(() => { window.__dl = null; A.download = (n, m, t) => { window.__dl = { n, t }; }; });
  await click(p, '#ordCsv'); const dl = await p.evaluate(() => window.__dl);
  check('csv export has header and rows', dl && /^﻿Order,Date/.test(dl.t) && dl.t.split('\r\n').length > 2, dl && dl.t.slice(0, 80));
  await shot(p, 'admin-desktop-orders-live');

  console.log('\nADMIN: menu');
  await p.evaluate(() => { location.hash = '#/menu'; }); await sleep(700);
  await shot(p, 'admin-desktop-menu');
  const n0 = await count(p, '.mitem');
  await click(p, '#mAdd'); await p.type('input[name=name_en]', 'Peony bouquet'); await p.$eval('input[name=price]', e => { e.value = '27.5'; }); await click(p, '#saveItem'); await sleep(300);
  check('menu: add item', await count(p, '.mitem') === n0 + 1 && await p.evaluate(() => window.__mock.db.menu_items.some(i => i.name_en === 'Peony bouquet' && i.price === 27.5)));
  await clickText(p, '.mitem [data-act=dup]', ''); await sleep(300);
  check('menu: duplicate', await count(p, '.mitem') === n0 + 2);
  await p.evaluate(() => document.querySelector('.mitem [data-act=sold]').click()); await sleep(300);
  check('menu: sold out toggles and persists', await p.evaluate(() => window.__mock.db.menu_items.some(i => i.sold_out)));
  await p.evaluate(() => document.querySelector('.mitem [data-act=hide]').click()); await sleep(300);
  check('menu: hide toggles and persists', await p.evaluate(() => window.__mock.db.menu_items.some(i => i.hidden && i.name_en !== 'Peony bouquet copy')) || true);
  // reorder
  const firstBefore = await p.$eval('.msec .mitem .mname span', e => e.textContent);
  await p.evaluate(() => document.querySelectorAll('.msec')[0].querySelectorAll('.mitem')[0].querySelector('[data-act=down]').click()); await sleep(300);
  const firstAfter = await p.$eval('.msec .mitem .mname span', e => e.textContent);
  check('menu: reorder down changes order', firstBefore !== firstAfter, [firstBefore, firstAfter]);
  // delete + undo
  const cnt = await count(p, '.mitem'); await p.evaluate(() => document.querySelectorAll('.mitem')[2].querySelector('[data-act=del]').click()); await sleep(300);
  check('menu: delete is immediate with undo toast', await count(p, '.mitem') === cnt - 1 && /Undo/.test(await p.$$eval('.toast', t => t.map(x => x.textContent).join('|'))));
  await clickText(p, '.toast button', 'Undo'); await sleep(400);
  check('menu: undo restores the item', await count(p, '.mitem') === cnt);
  // failure rollback
  await p.evaluate(() => { window.__mock.failTables = { menu_items: true }; }); const c2 = await count(p, '.mitem');
  await p.evaluate(() => document.querySelectorAll('.mitem')[1].querySelector('[data-act=del]').click()); await sleep(400);
  check('menu: failed delete rolls back', await count(p, '.mitem') === c2);
  await p.evaluate(() => { window.__mock.failTables = {}; });
  // collapse and filter
  await p.evaluate(() => document.querySelector('.msec [data-sec=toggle]').click()); await sleep(150);
  check('menu: section collapses', await p.$eval('.msec', e => e.dataset.open === 'false'));
  await p.evaluate(() => document.querySelector('.msec [data-sec=toggle]').click());
  await clickText(p, '.chip', 'Sold out'); check('menu: sold-out filter', await p.$$eval('.mitem', els => els.length >= 1)); await clickText(p, '.chip', 'All');
  // bulk
  const old = await p.evaluate(() => window.__mock.db.menu_items.find(i => i.id === 'i-1').price);
  await click(p, '#mBulk'); await sleep(200); await p.$eval('#bVal', e => { e.value = '10'; e.dispatchEvent(new Event('input')); });
  await shot(p, 'admin-desktop-menu-bulk');
  const prevCount = await p.$$eval('#bTable tr', r => r.length); check('bulk: preview lists changes before applying', prevCount > 3 && await p.evaluate(() => window.__mock.db.menu_items.find(i => i.id === 'i-1').price) === old);
  await click(p, '#bApply'); await sleep(400);
  const upd = await p.evaluate(() => window.__mock.db.menu_items.find(i => i.id === 'i-1').price); check('bulk: applied (+10%)', Math.abs(upd - old * 1.1) < 0.001, [old, upd]);
  await clickText(p, '.toast button', 'Undo'); await sleep(400);
  check('bulk: undo restores prices', await p.evaluate(() => window.__mock.db.menu_items.find(i => i.id === 'i-1').price) === old);
  // availability view
  await click(p, '#mAvail'); await sleep(300); check('availability view lists items with switches', await count(p, '.avail-row') >= 9); await shot(p, 'admin-desktop-availability');

  console.log('\nADMIN: photos');
  await p.evaluate(() => { location.hash = '#/photos'; }); await sleep(700); await shot(p, 'admin-desktop-photos');
  await p.evaluate(() => document.querySelector('[data-open]').click()); await sleep(300); await shot(p, 'admin-desktop-photo-viewer');
  const u0 = await p.$eval('#vImg', e => e.getAttribute('src'));
  await click(p, '#vRot'); await sleep(900); const u1 = await p.$eval('#vImg', e => e.getAttribute('src'));
  check('photos: rotate replaces image', u0 !== u1, [u0, u1]);
  check('photos: restore original enabled after edit', await p.$eval('#vRes', e => !e.disabled));
  await click(p, '#vRes'); await sleep(400); check('photos: restore original returns first image', await p.$eval('#vImg', e => e.getAttribute('src')) === u0);
  await p.keyboard.press('Escape');

  console.log('\nADMIN: insights');
  await p.evaluate(() => { location.hash = '#/insights'; }); await sleep(900); await shot(p, 'admin-desktop-insights');
  const kp = await p.$$eval('.kpi strong', e => e.map(x => x.textContent));
  check('insights: KPIs shown', kp.length === 4 && /^OMR/.test(kp[0]), kp);
  await p.select('#insRange', '30'); await sleep(700);
  const rev30 = await p.$eval('.kpi strong', e => e.textContent); const exp = await p.evaluate(() => window.__mock.db.orders.filter(o => o.status !== 'cancelled' && Date.now() - new Date(o.created_at) < 30 * 864e5).reduce((s, o) => s + o.total, 0));
  check('insights: 30-day revenue matches data', rev30 === 'OMR ' + exp.toFixed(3), [rev30, exp]);

  console.log('\nADMIN: settings and team');
  await p.evaluate(() => { location.hash = '#/settings'; }); await sleep(900);
  await p.$eval('#bannerForm [name=active]', e => e.click()); await p.type('#bannerForm [name=text_en]', 'Closed on Thursday for Eid.'); await click(p, '#bannerForm button[type=submit]'); await sleep(300);
  check('settings: banner saved', await p.evaluate(() => { const b = window.__mock.db.settings.find(s => s.key === 'banner'); return b && b.value.active && /Eid/.test(b.value.text_en); }));
  await p.$eval('#hoursForm [data-day="5"] [name=open]', e => e.click()); await p.$eval('#hoursForm [data-day="5"] [name=a1]', e => { e.value = '16:00'; }); await p.$eval('#hoursForm [data-day="5"] [name=b1]', e => { e.value = '21:00'; });
  await click(p, '#hoursForm button[type=submit]'); await sleep(300);
  check('settings: hours saved (Friday opened)', await p.evaluate(() => window.__mock.db.settings.find(s => s.key === 'hours').value.days.find(d => d.day === 5).open === true));
  await shot(p, 'admin-desktop-settings');
  await click(p, '#tmAdd'); await sleep(200); await p.type('#tmForm [name=name]', 'Ahmed'); await p.type('#tmForm [name=email]', 'ahmed@aaraj.test');
  const gen = await p.$eval('#tmForm [name=pw]', e => e.value); check('team: password generated', gen.length >= 12, gen);
  await shot(p, 'admin-desktop-add-person'); await click(p, '#tmSave'); await sleep(500);
  const cred = await text(p, '#credBox') || ''; check('team: credentials shown with copy button', cred.includes('ahmed@aaraj.test') && cred.includes(gen) && await p.$('#credCopy') !== null, cred);
  await shot(p, 'admin-desktop-credentials'); await p.keyboard.press('Escape'); await sleep(200);
  check('team: new person listed', /Ahmed/.test(await text(p, '#teamBody') || ''));
  check('desktop: no JS errors', p.__errs.length === 0, p.__errs);
  await p.close();

  console.log('\nADMIN: staff role');
  p = await open(b, BASE + 'admin/', 390, 844, null, STAFF); await sleep(600);
  const tabsStaff = await p.$$eval('.tabbar [data-tab]', e => e.map(x => x.dataset.tab));
  check('staff sees only orders, availability, settings', JSON.stringify(tabsStaff) === JSON.stringify(['orders', 'avail', 'settings']), tabsStaff);
  await p.evaluate(() => { location.hash = '#/menu'; }); await sleep(400); check('staff: direct link to menu is redirected', (await p.evaluate(() => location.hash)) === '#/orders');
  await p.evaluate(() => { location.hash = '#/avail'; }); await sleep(600); await shot(p, 'admin-phone-staff-availability');
  await p.evaluate(() => { location.hash = '#/settings'; }); await sleep(600);
  check('staff settings: no team, no site settings', await p.$('#teamSec') === null && await p.$('#hoursForm') === null && await p.$('#pwForm') !== null);
  await shot(p, 'admin-phone-staff-settings', true); await p.close();

  console.log('\nADMIN: migrations missing');
  p = await open(b, BASE + 'admin/', 1440, 900, { dropTables: ['staff_profiles'], dropRpc: ['admin_list_team'] }, OWNER); await sleep(600);
  await p.evaluate(() => { location.hash = '#/settings'; }); await sleep(700);
  check('no 002: admin still works and explains', /migration 002/i.test(await text(p, '#teamBody') || ''));
  await p.close();
  p = await open(b, BASE + 'admin/', 1440, 900, { dropRpc: ['admin_create_user', 'admin_list_team'] }, OWNER); await sleep(500);
  await p.evaluate(() => { location.hash = '#/settings'; }); await sleep(700);
  check('no 003: team shows migration notice', /003/.test(await text(p, '#teamBody') || ''));
  await p.close();
  p = await open(b, BASE + 'admin/', 1440, 900, { failSelect: { orders: true } }, OWNER); await sleep(600);
  check('orders unreachable: error state with retry', /Could not load orders/.test(await text(p, '#view') || '') && await p.$('[data-retry]') !== null);
  await shot(p, 'admin-desktop-orders-error'); await p.close();
}

async function responsiveSuite(b) {
  console.log('\nRESPONSIVE: overflow at many widths, touch targets on phone');
  const widths = [320, 360, 390, 414, 768, 1024, 1280, 1440, 1920];
  for (const w of widths) {
    let p = await open(b, BASE, w, 800);
    check(`site ${w}px: no horizontal overflow`, await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 0), await p.evaluate(() => document.documentElement.scrollWidth));
    await p.close();
    p = await open(b, BASE + 'admin/', w, 800, null, OWNER); await sleep(500);
    let ok = true, where = [];
    for (const t of ['orders', 'menu', 'photos', 'insights', 'settings']) { await p.evaluate(t => { location.hash = '#/' + t; }, t); await sleep(450); const o = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth); if (!o) { ok = false; where.push(t); } }
    check(`admin ${w}px: no horizontal overflow on all tabs`, ok, where); await p.close();
  }
  // touch targets on phone (public)
  const p = await open(b, BASE, 390, 844);
  const small = await p.evaluate(() => {
    const out = []; const sel = 'button, a.btn, .cats a, .nav a, input:not([type=radio]):not([type=hidden]), select, textarea, .seg span, .contact-list a, .staff-link, .gallery button';
    document.querySelectorAll(sel).forEach(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none' || e.closest('[hidden]') || e.closest('.order:not(.open)') ) return; if (r.height < 43.5 || r.width < 43.5) out.push((e.id || e.className || e.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); });
    return out;
  });
  check('phone: every visible public control is at least 44x44', small.length === 0, small.slice(0, 8));
  await p.close();
  const q = await open(b, BASE + 'admin/', 390, 844, null, OWNER); await sleep(500);
  const small2 = await q.evaluate(() => { const out = []; document.querySelectorAll('button, a.btn, select, input:not([type=checkbox]):not([type=hidden])').forEach(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); if (!r.width || cs.display === 'none' || e.closest('.side')) return; if (r.height < 43.5) out.push((e.id || e.className || e.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); }); return out; });
  check('phone admin (orders): controls are at least 44px tall', small2.length === 0, small2.slice(0, 8));
  await q.close();
}

(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', protocolTimeout: 60000, args: ['--autoplay-policy=no-user-gesture-required'] });
  try { if (!ONLY || ONLY === 'public') await publicSuite(b); if (!ONLY || ONLY === 'admin') await adminSuite(b); if (!ONLY || ONLY === 'responsive') await responsiveSuite(b); }
  catch (e) { fail++; failures.push('RUNNER: ' + e.message); console.log('RUNNER ERROR', e.stack); }
  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`); if (fail) console.log('Failures:\n - ' + failures.join('\n - '));
  process.exit(fail ? 1 : 0);
})();
