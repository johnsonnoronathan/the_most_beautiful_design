// Bundle every composition plus the Remotion Player into one self-contained page.
//   node preview/build.mjs   → out/preview/index.html (+ the score next to it)
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('out/preview');
const tmp = path.resolve('out/preview-build');
fs.rmSync(tmp, {recursive: true, force: true});

await esbuild.build({
  entryPoints: ['preview/main.tsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  outdir: tmp,
  loader: {'.woff2': 'dataurl', '.png': 'dataurl'},
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

fs.mkdirSync(path.join(outDir, 'art/afterglow'), {recursive: true});
fs.writeFileSync(path.join(outDir, 'index.html'), html);
fs.copyFileSync('public/art/afterglow/score.mp3', path.join(outDir, 'art/afterglow/score.mp3'));
console.log(`out/preview/index.html  ${(html.length / 1024 / 1024).toFixed(2)} MB`);
