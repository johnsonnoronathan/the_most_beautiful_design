// Assemble the design-page projects into one previewable site:
//   out/design-preview/index.html          gallery of every design (thumbnails, links)
//   out/design-preview/<project>/<page>    the standalone pages, unchanged except the back link
//   out/design-preview/thumbs/*.jpg        the screenshots stored in each project's assets/thumbs
//   node scripts/build-design-preview.mjs
// Titles, sizes and descriptions come from each project's pages.json; refresh the
// screenshots with scripts/page-thumbs.mjs after changing a design.
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('out/design-preview');
const PROJECTS = [
  {dir: 'ma', name: 'Ma', mark: '間'},
  {dir: 'afterglow-studies', name: 'Afterglow Studies', mark: ''},
].map((p) => ({...p, ...JSON.parse(fs.readFileSync(path.resolve('projects', p.dir, 'pages.json'), 'utf8'))}));

fs.rmSync(OUT, {recursive: true, force: true});
fs.mkdirSync(path.join(OUT, 'thumbs'), {recursive: true});

// 1. copy each project's pages and their scripts/styles; the back link points at the gallery
for (const p of PROJECTS) {
  const src = path.resolve('projects', p.dir);
  fs.mkdirSync(path.join(OUT, p.dir), {recursive: true});
  for (const f of fs.readdirSync(src)) {
    if (!/\.(html|css|js)$/.test(f) || f === 'index.html') continue;
    let text = fs.readFileSync(path.join(src, f), 'utf8');
    if (f.endsWith('.html')) text = text.replace('<a href="index.html">', '<a href="../index.html">');
    fs.writeFileSync(path.join(OUT, p.dir, f), text);
  }
}

// 2. thumbnails: each page in its #embed mode, taken by scripts/page-thumbs.mjs
for (const p of PROJECTS) {
  for (const {file} of p.pages) {
    const stem = file.replace('.html', '');
    fs.copyFileSync(path.resolve('projects', p.dir, 'assets/thumbs', `${stem}.jpg`), path.join(OUT, 'thumbs', `${p.dir}-${stem}.jpg`));
  }
}

// 3. the gallery page (published as the artifact's main page: the host adds doctype and head)
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const shelves = PROJECTS.map(
  (p) => `
  <section class="shelf shelf-${p.dir}" aria-labelledby="h-${p.dir}">
    <div class="shelf-head">
      <h2 id="h-${p.dir}">${esc(p.name)}${p.mark ? ` <span class="mark" lang="ja">${p.mark}</span>` : ''}</h2>
      <p>${esc(p.blurb)}</p>
    </div>
    <ul class="works">
      ${p.pages
        .map(
          ({file, kicker, width, height, title, summary}) => `<li>
        <a class="work" href="${p.dir}/${file}">
          <span class="thumb"><img src="thumbs/${p.dir}-${file.replace('.html', '')}.jpg" alt="${esc(title)}" width="1200" height="900" loading="lazy"></span>
          <span class="meta"><span>${esc(kicker)}</span><span>${width} × ${height}</span></span>
          <span class="name">${esc(title)}</span>
          <span class="desc">${esc(summary)}</span>
        </a>
      </li>`,
        )
        .join('\n      ')}
    </ul>
  </section>`,
).join('\n');

const html = `<title>Ma &amp; Afterglow Studies</title>
<meta name="description" content="Six design pages from the studio: the Ma series and the Afterglow studies.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@1,400&amp;family=Geist:wght@300;400;500&amp;family=Geist+Mono:wght@400&amp;family=Hanken+Grotesk:wght@200;300&amp;family=Noto+Serif+JP:wght@300&amp;display=swap">
<style>
  /* Layout: a dark viewing room; one shelf per project, each titled in its own typeface. */
  :root {
    --room: #0b0c0f;
    --line: #262932;
    --text: #ece7df;
    --muted: #9ea2aa;
    --sun: #e4572e;
    --glow: #ffcb8e;
    --body: 'Geist', 'Helvetica Neue', Arial, sans-serif;
    --mono: 'Geist Mono', ui-monospace, Menlo, Consolas, monospace;
    --serif: 'Bodoni Moda', 'Bodoni 72', Didot, Georgia, serif;
    --thin: 'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif;
    color-scheme: dark;
  }
  html, body { background: var(--room); color: var(--text); }
  body { font-family: var(--body); font-size: 16px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
  .wrap { max-width: 1240px; margin: 0 auto; padding-inline: clamp(16px, 4vw, 48px); padding-block: 36px 72px; display: flex; flex-direction: column; gap: 64px; }
  .masthead { display: flex; flex-direction: column; gap: 10px; }
  .kicker, .meta { font-family: var(--mono); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
  .masthead h1 { margin: 0; font-family: var(--thin); font-weight: 200; font-size: clamp(40px, 6vw, 64px); letter-spacing: -0.03em; line-height: 1.05; text-wrap: balance; }
  .masthead h1 em { font-family: var(--serif); font-style: italic; font-weight: 400; letter-spacing: -0.02em; }
  .masthead p { margin: 0; max-width: 62ch; color: var(--muted); }
  .shelf { display: flex; flex-direction: column; gap: 28px; padding-top: 32px; border-top: 1px solid var(--line); }
  .shelf-head { display: grid; grid-template-columns: minmax(0, auto) minmax(0, 1fr); gap: 8px 40px; align-items: end; }
  .shelf-head h2 { margin: 0; line-height: 0.9; }
  .shelf-ma h2 { font-family: var(--thin); font-weight: 200; font-size: clamp(64px, 9vw, 112px); letter-spacing: -0.05em; }
  .shelf-ma .mark { font-family: 'Noto Serif JP', serif; font-weight: 300; font-size: 0.32em; letter-spacing: 0; color: var(--muted); vertical-align: 0.9em; }
  .shelf-afterglow-studies h2 { font-family: var(--serif); font-style: italic; font-weight: 400; font-size: clamp(48px, 7vw, 88px); letter-spacing: -0.03em; }
  .shelf-head p { margin: 0; max-width: 60ch; color: #c9c5bf; font-weight: 300; }
  .works { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 28px 24px; }
  .work { display: flex; flex-direction: column; gap: 10px; color: var(--text); text-decoration: none; min-width: 0; }
  .thumb { display: block; aspect-ratio: 4 / 3; max-width: 100%; border-radius: 4px; overflow: hidden; background: #000; outline: 1px solid var(--line); transition: outline-color 160ms ease; }
  .thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .work:hover .thumb { outline: 2px solid var(--muted); }
  .shelf-ma .work:hover .thumb { outline-color: var(--sun); }
  .shelf-afterglow-studies .work:hover .thumb { outline-color: var(--glow); }
  .work:focus-visible { outline: none; }
  .work:focus-visible .thumb { outline: 2px solid var(--text); outline-offset: 3px; }
  .meta { display: flex; justify-content: space-between; gap: 12px; font-size: 11px; }
  .name { font-size: 19px; font-weight: 400; line-height: 1.25; }
  .desc { font-size: 15px; font-weight: 300; color: var(--muted); }
  .colophon { padding-top: 24px; border-top: 1px solid var(--line); font-size: 13px; color: var(--muted); max-width: 75ch; }
  @media (max-width: 720px) { .shelf-head { grid-template-columns: minmax(0, 1fr); } }
  @media (prefers-reduced-motion: reduce) { .thumb { transition: none; } }
</style>
<div class="wrap">
  <header class="masthead">
    <span class="kicker">The Most Beautiful Design · design pages</span>
    <h1>Ma <span aria-hidden="true">&amp;</span> <em>Afterglow Studies</em></h1>
    <p>Six designs from the studio's canvas, rebuilt as standalone pages. Open one to use it: the sun swatches, the valley seed, the day-of-light scrubber and the timer all work.</p>
  </header>
${shelves}
  <footer class="colophon">Source: <code>projects/ma</code> and <code>projects/afterglow-studies</code> in the repo. Each page also opens straight from disk.</footer>
</div>
`;
fs.writeFileSync(path.join(OUT, 'index.html'), html);

const files = [];
const walk = (d) => fs.readdirSync(d, {withFileTypes: true}).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.relative(OUT, path.join(d, e.name)))));
walk(OUT);
console.log(files.filter((f) => f !== 'index.html').join('\n'));
