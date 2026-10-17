// Bundle every composition plus the Remotion Player into one page, and copy the design
// pages beside it so they can load live on its stage.
//   node projects/screening-room/build.mjs
//   → out/screening-room/index.html, media/ (audio), pages/<project>/ (designs + thumbnails)
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const outDir = path.join(root, 'out/screening-room');
const tmp = path.join(root, 'out/screening-room-build');
fs.rmSync(tmp, {recursive: true, force: true});
fs.rmSync(outDir, {recursive: true, force: true});

await esbuild.build({
  entryPoints: [path.join(here, 'main.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  outdir: tmp,
  // fonts and textures are inlined; audio is emitted next to the page
  loader: {'.woff2': 'dataurl', '.png': 'dataurl', '.mp3': 'file'},
  assetNames: 'media/[name]-[hash]',
  // KaTeX lists woff2 first; browsers never fetch these fallbacks.
  external: ['*.woff', '*.ttf'],
  define: {'process.env.NODE_ENV': '"production"'},
  logLevel: 'warning',
});

const js = fs.readFileSync(path.join(tmp, 'main.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
const css = fs.readFileSync(path.join(tmp, 'main.css'), 'utf8').replace(/<\/style/gi, '<\\/style');

const html = `<title>Screening Room</title>
<meta name="description" content="Live previews of every video project, shelved by category.">
<style>${css}</style>
<div id="root"></div>
<script>${js}</script>
`;

fs.mkdirSync(path.join(outDir, 'media'), {recursive: true});
fs.writeFileSync(path.join(outDir, 'index.html'), html);
const media = fs.readdirSync(path.join(tmp, 'media'));
for (const f of media) fs.copyFileSync(path.join(tmp, 'media', f), path.join(outDir, 'media', f));

// Page projects are the ones with a pages.json. Copy their pages, scripts, styles and
// thumbnails; each page's back link returns to its own place in the Screening Room.
const pageFiles = [];
for (const id of fs.readdirSync(path.join(root, 'projects'))) {
  const src = path.join(root, 'projects', id);
  if (!fs.existsSync(path.join(src, 'pages.json'))) continue;
  const dest = path.join(outDir, 'pages', id);
  fs.mkdirSync(path.join(dest, 'assets/thumbs'), {recursive: true});
  for (const f of fs.readdirSync(src)) {
    if (!/\.(html|css|js)$/.test(f) || f === 'index.html') continue;
    let text = fs.readFileSync(path.join(src, f), 'utf8');
    if (f.endsWith('.html')) text = text.replace('<a href="index.html">', `<a href="../../index.html#${id}-${f.replace('.html', '')}">`);
    fs.writeFileSync(path.join(dest, f), text);
    pageFiles.push(`pages/${id}/${f}`);
  }
  for (const f of fs.readdirSync(path.join(src, 'assets/thumbs'))) {
    fs.copyFileSync(path.join(src, 'assets/thumbs', f), path.join(dest, 'assets/thumbs', f));
    pageFiles.push(`pages/${id}/assets/thumbs/${f}`);
  }
}

console.log(`out/screening-room/index.html  ${(html.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`media: ${media.join(', ')}`);
console.log(`pages: ${pageFiles.length} files in pages/`);
