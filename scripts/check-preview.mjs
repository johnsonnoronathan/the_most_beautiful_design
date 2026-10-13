// Smoke-test the built preview page in headless Chromium: console errors, a screenshot,
// and whether the player advances after pressing play.
//   node scripts/check-preview.mjs [hash]
import {chromium} from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('out/preview');
const types = {'.html': 'text/html', '.mp3': 'audio/mpeg'};
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!file.startsWith(root) || !fs.existsSync(file)) return res.writeHead(404).end();
  if (req.url === '/favicon.ico') return res.writeHead(204).end();
  res.writeHead(200, {'content-type': types[path.extname(file)] ?? 'application/octet-stream'});
  // mimic the publish skeleton, which supplies doctype, charset and viewport
  if (file.endsWith('.html')) {
    return res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body style="margin:0">${fs.readFileSync(file, 'utf8')}</body></html>`);
  }
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4917, r));

const browser = await chromium.launch({executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
const problems = [];
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && problems.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

const hash = process.argv[2] ? `#${process.argv[2]}` : '';
await page.goto(`http://localhost:4917/index.html${hash}`);
await page.waitForTimeout(4000);
await page.screenshot({path: 'out/preview-top.png'});

// press play on the main player and see the frame advance
const before = await page.evaluate(() => document.querySelector('.screen')?.innerText ?? '');
await page.click('.screen', {position: {x: 300, y: 200}});
await page.waitForTimeout(3000);
await page.screenshot({path: 'out/preview-playing.png'});
await page.screenshot({path: 'out/preview-full.png', fullPage: true});
const phone = await browser.newPage({viewport: {width: 400, height: 860}});
await phone.goto(`http://localhost:4917/index.html${hash}`);
await phone.waitForTimeout(3000);
const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
await phone.screenshot({path: 'out/preview-phone.png', fullPage: true});

console.log(JSON.stringify({problems, phoneHorizontalOverflowPx: overflow, before: before.slice(0, 80)}, null, 2));
await browser.close();
server.close();
