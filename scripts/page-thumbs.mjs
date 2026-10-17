// Screenshot every design listed in a page project's pages.json, in its #embed mode,
// into projects/<project>/assets/thumbs/<page>.jpg (used by the Screening Room).
//   node scripts/page-thumbs.mjs projects/ma projects/afterglow-studies
import {chromium} from 'playwright-core';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve('.');
const types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8'};
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return res.writeHead(404).end();
  res.writeHead(200, {'content-type': types[path.extname(file)] ?? 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4920, r));
const args = process.env.HTTPS_PROXY ? [`--proxy-server=${process.env.HTTPS_PROXY}`, '--proxy-bypass-list=localhost;127.0.0.1'] : [];
const browser = await chromium.launch({executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args});
const page = await browser.newPage({viewport: {width: 1200, height: 900}});

for (const dir of process.argv.slice(2)) {
  const {pages} = JSON.parse(fs.readFileSync(path.join(dir, 'pages.json'), 'utf8'));
  fs.mkdirSync(path.join(dir, 'assets/thumbs'), {recursive: true});
  for (const {file} of pages) {
    await page.goto(`http://localhost:4920/${dir}/${file}#embed`);
    await page.waitForTimeout(2200);
    const out = path.join(dir, 'assets/thumbs', file.replace('.html', '.jpg'));
    await page.screenshot({path: out, type: 'jpeg', quality: 84});
    console.log(out);
  }
}
await browser.close();
server.close();
