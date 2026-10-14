// Smoke-test static page projects in headless Chromium: console errors, failed
// requests, horizontal overflow at phone width, and a screenshot of each page.
//   node scripts/check-pages.mjs projects/ma projects/afterglow-studies
import {chromium} from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const types = {'.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json'};
const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') return res.writeHead(204).end();
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return res.writeHead(404).end();
  res.writeHead(200, {'content-type': types[path.extname(file)] ?? 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4918, r));

// Web fonts come from Google Fonts; in a sandbox reach them through HTTPS_PROXY.
// (Playwright's own proxy option also proxies localhost, so pass Chromium flags directly.)
const args = process.env.HTTPS_PROXY ? [`--proxy-server=${process.env.HTTPS_PROXY}`, '--proxy-bypass-list=localhost;127.0.0.1'] : [];
const browser = await chromium.launch({executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args});
fs.mkdirSync('out/pages', {recursive: true});
const report = {};

for (const dir of process.argv.slice(2)) {
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.html'))) {
    const url = `http://localhost:4918/${dir}/${file}`;
    const issues = [];
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
    page.on('console', (m) => m.type() === 'error' && issues.push(`console: ${m.text()}`));
    page.on('pageerror', (e) => issues.push(`pageerror: ${e.message}`));
    page.on('response', (r) => r.status() >= 400 && issues.push(`http ${r.status()}: ${r.url()}`));
    await page.goto(url);
    await page.waitForTimeout(2500);
    const name = `${path.basename(dir)}-${file.replace('.html', '')}`;
    await page.screenshot({path: `out/pages/${name}.png`});
    const phone = await browser.newPage({viewport: {width: 390, height: 844}});
    await phone.goto(url);
    await phone.waitForTimeout(1500);
    const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) issues.push(`phone: ${overflow}px horizontal overflow`);
    await page.close();
    await phone.close();
    report[name] = issues.length ? issues : 'ok';
  }
}

console.log(JSON.stringify(report, null, 2));
await browser.close();
server.close();
