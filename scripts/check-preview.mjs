// Smoke-test the built Screening Room in headless Chromium: console errors, a screenshot,
// and whether the player advances after pressing play (or, for a design, whether the live
// page came up on the stage).
//   node scripts/check-preview.mjs [hash]      e.g. calculus-02-integral, ma-timer
import {chromium} from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('out/screening-room');
const types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg'};
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (req.url === '/favicon.ico') return res.writeHead(204).end();
  if (!file.startsWith(root) || !fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, {'content-type': types[path.extname(file)] ?? 'application/octet-stream'});
  // mimic the publish skeleton, which supplies doctype, charset and viewport
  if (file === path.join(root, 'index.html')) {
    return res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body style="margin:0">${fs.readFileSync(file, 'utf8')}</body></html>`);
  }
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4917, r));

// the design pages use Google Fonts; reach them through HTTPS_PROXY (Chromium flags, not Playwright's proxy)
const args = process.env.HTTPS_PROXY ? [`--proxy-server=${process.env.HTTPS_PROXY}`, '--proxy-bypass-list=localhost;127.0.0.1'] : [];
const browser = await chromium.launch({executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args});
const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
const log = [];
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && log.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => log.push(`pageerror: ${e.message}`));
page.on('response', (r) => r.status() >= 400 && log.push(`http ${r.status()}: ${r.url()}`));
page.on('request', (r) => r.url().endsWith('.mp3') && log.push(`requested: ${r.url()}`));

const hash = process.argv[2] ? `#${process.argv[2]}` : '';
await page.goto(`http://localhost:4917/index.html${hash}`);
await page.waitForTimeout(4000);
await page.screenshot({path: 'out/preview-top.png'});

const design = await page.evaluate(() => document.querySelector('.design')?.getAttribute('data-state') ?? null);
// press play on the main player and see the frame advance
const before = await page.evaluate(() => document.querySelector('.screen')?.innerText ?? '');
if (!design) {
  await page.click('.screen', {position: {x: 300, y: 200}});
  await page.waitForTimeout(3000);
}
await page.screenshot({path: 'out/preview-playing.png'});
// scroll through once so lazy thumbnails load before the full-page shot
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1200);
await page.screenshot({path: 'out/preview-full.png', fullPage: true});
const phone = await browser.newPage({viewport: {width: 400, height: 860}});
await phone.goto(`http://localhost:4917/index.html${hash}`);
await phone.waitForTimeout(3000);
const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
await phone.screenshot({path: 'out/preview-phone.png', fullPage: true});

console.log(JSON.stringify({log, design, phoneHorizontalOverflowPx: overflow, before: before.slice(0, 80)}, null, 2));
await browser.close();
server.close();
