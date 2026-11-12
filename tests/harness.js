// Test harness: serves real files from localhost, swaps the Supabase CDN script for tests/mock-supabase.js,
// and gives config.js fake credentials so the pages think they are connected.
const fs = require('fs'), path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'mock-supabase.js'), 'utf8');
const CFG = 'window.AARAJ_CONFIG={supabaseUrl:"https://mock.supabase.test",supabasePublishableKey:"sb_publishable_mock",siteUrl:"http://localhost:8123/",whatsapp:"96877399377",currency:"OMR"};';
exports.install = async (page, pre) => {
  if (pre) await page.evaluateOnNewDocument(p => { window.__preMock = p; }, pre);
  await page.setRequestInterception(true);
  page.on('request', req => {
    const u = req.url();
    if (u.includes('supabase.min.js')) return req.respond({ status: 200, contentType: 'application/javascript', body: MOCK });
    if (/\/js\/config\.js/.test(u)) return req.respond({ status: 200, contentType: 'application/javascript', body: CFG });
    req.continue();
  });
};
