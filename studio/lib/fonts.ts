import {cancelRender, continueRender, delayRender} from 'remotion';
import bodoni from '../fonts/BodoniModa-Italic.woff2';
import geist from '../fonts/Geist.woff2';
import geistMono from '../fonts/GeistMono.woff2';

export const SERIF = "'Bodoni Moda', serif";
export const SANS = "'Geist', sans-serif";
export const MONO = "'Geist Mono', monospace";

let loaded = false;

/** Load the studio's typefaces once, holding the first frame until they are ready. */
export const loadStudioFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('Loading studio fonts');
  const faces = [
    new FontFace('Bodoni Moda', `url(${bodoni}) format('woff2')`, {style: 'italic', weight: '400'}),
    new FontFace('Geist', `url(${geist}) format('woff2')`, {weight: '100 900'}),
    new FontFace('Geist Mono', `url(${geistMono}) format('woff2')`, {weight: '400'}),
  ];
  Promise.all(faces.map((f) => f.load()))
    .then((fonts) => {
      fonts.forEach((f) => (document.fonts as unknown as Set<FontFace>).add(f));
      continueRender(handle);
    })
    .catch((err) => cancelRender(err));
};

let mathLoaded = false;

/** KaTeX's @font-face rules come from its stylesheet; make sure the faces are fetched before frames are captured. */
export const loadMathFonts = () => {
  if (mathLoaded || typeof document === 'undefined') return;
  mathLoaded = true;
  const handle = delayRender('Loading KaTeX fonts');
  const specs = [
    '40px KaTeX_Main',
    'italic 40px KaTeX_Main',
    'bold 40px KaTeX_Main',
    'italic 40px KaTeX_Math',
    '40px KaTeX_Size1',
    '40px KaTeX_Size2',
    '40px KaTeX_Size3',
    '40px KaTeX_Size4',
    '40px KaTeX_AMS',
  ];
  Promise.all(specs.map((s) => document.fonts.load(s)))
    .then(() => continueRender(handle))
    .catch((err) => cancelRender(err));
};
