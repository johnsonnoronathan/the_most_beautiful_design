// Render a handful of stills from one or more compositions with a single bundle.
//   node scripts/stills.mjs Calculus-01-Derivative:150,600 Afterglow:960
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});

for (const arg of process.argv.slice(2)) {
  const [id, frames] = arg.split(':');
  const composition = await selectComposition({serveUrl, id, browserExecutable});
  for (const f of frames.split(',').map(Number)) {
    const output = path.resolve('out/stills', `${id}-${String(f).padStart(4, '0')}.png`);
    await renderStill({composition, serveUrl, output, frame: f, browserExecutable, imageFormat: 'png'});
    console.log(output);
  }
}
