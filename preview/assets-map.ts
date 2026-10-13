// Must be the preview's first import: compositions resolve fonts and textures at module load.
import bodoni from '../public/shared/fonts/BodoniModa-Italic.woff2';
import geist from '../public/shared/fonts/Geist.woff2';
import geistMono from '../public/shared/fonts/GeistMono.woff2';
import grain from '../public/art/afterglow/grain.png';

window.__STUDIO_ASSETS__ = {
  'shared/fonts/BodoniModa-Italic.woff2': bodoni,
  'shared/fonts/Geist.woff2': geist,
  'shared/fonts/GeistMono.woff2': geistMono,
  'art/afterglow/grain.png': grain,
};
// Larger media (the score) is published next to the page.
window.__STUDIO_ASSET_BASE__ = './';
