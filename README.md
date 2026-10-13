# Studio

Video projects made with [Remotion](https://www.remotion.dev/), shelved by
category. Every film is code: nothing is drawn by hand or filmed.

| Category | Project | Videos |
| --- | --- | --- |
| Learning | **Calculus, visually** | 1 · The derivative (1:08) · 2 · The integral (1:04) · 3 · The fundamental theorem (1:10) |
| Art | **Afterglow** | One generated valley through one day of light, with an original score (0:48) |

## Preview without rendering

Rendering MP4s is slow, so the fastest way to watch is the **Screening Room**:
one page that plays every composition live in the browser with the Remotion
Player, shelved by the same categories.

```sh
npm install
npm run preview:build    # → out/preview/index.html (self-contained; the score sits next to it)
npm run studio           # or scrub and edit in Remotion Studio, which uses the same folders
```

## Render to MP4

Only when you need a file:

```sh
npx remotion render Calculus-01-Derivative out/calculus-01.mp4
npm run render:calculus       # all three chapters
npm run render:afterglow
```

To use a Chromium that is already installed (for example in a sandbox), set
`REMOTION_BROWSER` to its executable. `npm run stills -- Afterglow:960` renders
single frames, which is the quickest way to check a change.

## Layout

```
src/
  catalog.ts                     one catalog → Studio folders and the preview page
  Root.tsx                       Category / Project / Video folders
  lib/                           shared fonts, asset paths and the score synthesizer
  projects/
    learning/calculus/           kit.tsx (plots, KaTeX, captions), one file per chapter, score/
    art/afterglow/               engine.ts, Valley.tsx, Afterglow.tsx, score/compose.py
public/
  shared/fonts/                  Bodoni Moda, Geist, Geist Mono (SIL OFL)
  art/afterglow/                 grain texture and the synthesized score
  learning/calculus/             one synthesized score per chapter
preview/                         the Screening Room page and its build script
scripts/                         stills renderer and a headless smoke test for the page
```

To add a project, put it under `src/projects/<category>/<project>/` and list
it in `src/catalog.ts`; it then appears in both the Studio and the Screening Room.

## Calculus, visually

A three-chapter tutorial in one consistent visual language: the function is
always amber, slopes and derivatives teal, accumulated area coral.

1. **The derivative.** A car travels `s(t) = t²`. Secant lines shrink into the
   tangent while a table of slopes closes in on 2; the algebra
   `((1+h)² − 1)/h = 2 + h` confirms it, and the tangent sweeps out `s′(t) = 2t`.
2. **The integral.** Distance from speed: a rectangle for constant speed, then
   4 → 256 Riemann rectangles under `v(t) = t²` with a live convergence chart
   approaching 8/3, and Σ becoming ∫.
3. **The fundamental theorem.** The area function `A(x)` is traced as the edge
   moves; a magnified sliver shows `dA/dx = f(x)`; the theorem turns chapter 2's
   256 rectangles into one line: `∫₀² t² dt = [t³/3]₀² = 8/3`.

Each chapter has its own background score, quieter than Afterglow's so it sits
under the captions. A shared four-note motif opens every chapter and is answered
on its closing card; chords change with the scenes; small accents mark the
reveals (a rising note per table row in chapter 1, per doubling of the
rectangles in chapter 2, a cascade on the final 8/3 in chapter 3).

```sh
python3 src/projects/learning/calculus/score/compose.py   # → public/learning/calculus/ch0N-score.mp3
```

Both scores use the small numpy synthesizer in `src/lib/score/synth.py`.

## Afterglow score

`src/projects/art/afterglow/score/compose.py` writes the score from scratch with
numpy, timed to the film:

```sh
python3 src/projects/art/afterglow/score/compose.py
ffmpeg -i out/afterglow-score.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 \
  -ar 48000 -c:a libmp3lame -b:a 192k public/art/afterglow/score.mp3
```
