# CLAUDE.md

Working notes for this repo: what it is, how to work in it, and the lessons
learned so far. **Read it before starting; add to "Lessons learned" before
finishing** (see the last section).

## What this repo is

A studio of things made entirely from code: Remotion videos (films, tutorials),
design pages, and pages that present them. The bar is in the repo's name: aim
for the most beautiful version, not a safe one. `README.md` has the project
table and quick start.

## Layout and conventions

- **One folder per project** in `projects/<project-name>/`, named after the
  project in lower case with hyphens (`Calculus, visually` → `calculus-visually`,
  `Ma 間` → `ma`). Everything the project needs lives inside it: code, `assets/`,
  `score/`, `voice/`, `canvas/` sources, a short `README.md`.
- **Categories are labels, not folders**: Learning, Art, Design, Page. Videos get
  theirs in `studio/catalog.ts`; every project gets a row in `README.md`.
- **`studio/`** holds only what all projects share: Remotion entry
  (`index.ts`, `Root.tsx`), `catalog.ts`, `lib/fonts.ts`, `lib/synth.py`, `fonts/`.
- **Videos**: compositions in the project folder, listed in `studio/catalog.ts`
  (project `id` = folder name). Import assets (`import score from
  './assets/score.mp3'`); do not use `staticFile` or a `public/` folder. Remotion
  ids and Folder names allow only letters, digits and `-`.
- **Pages**: standalone HTML that opens straight from disk. Fixed-size designs
  sit in a `frame.css`/`frame.js` viewing room (scale to fit; `#embed` mode for
  the previews on the project's `index.html`, `#stage` mode for the Screening
  Room). Google Fonts with real fallback stacks. Keep the original design-canvas
  source in `canvas/`.
- **Designs in the Screening Room**: each page project lists its designs in
  `pages.json` and keeps a screenshot of each in `assets/thumbs/`
  (`scripts/page-thumbs.mjs`); `studio/catalog.ts` puts the project on the Design
  shelf. The design gallery reads the same files.
- **Visual language**: each project commits to one palette and type system and
  keeps it everywhere (e.g. Calculus: function amber, slopes teal, area coral).
- **Generated outputs** go to `out/` (git-ignored). Tool caches go to `.cache/`
  (git-ignored). Never commit `node_modules/`, `out/`, `.cache/`, `__pycache__/`.

## Commands

```sh
npm run typecheck                         # tsc
npm run studio                            # Remotion Studio
npm run screening-room                    # build the preview page (videos + designs) → out/screening-room/
node scripts/check-preview.mjs [hash]     # smoke-test the Screening Room (hash e.g. ma-timer)
node scripts/page-thumbs.mjs projects/ma  # re-take design thumbnails → projects/ma/assets/thumbs/
node scripts/check-pages.mjs projects/ma  # smoke-test page projects (errors, overflow, screenshots → out/pages/)
node scripts/build-design-preview.mjs     # gallery + design pages + thumbnails → out/design-preview/ (publish this)
npm run stills -- Afterglow:960 Calculus-02-Integral:300,1180   # stills → out/stills/
npx remotion render <Id> out/x.wav --codec=wav   # audio-only render, seconds not minutes
scripts/render-films.sh [out-dir]         # every film as an MP4 (~35 min here); add new films to its list
python3 projects/<p>/score/compose.py     # regenerate a score
scripts/setup-tts.sh && .cache/tts/venv/bin/python projects/calculus-visually/voice/narrate.py   # voiceover
```

In this cloud sandbox set
`REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`;
Playwright scripts default to `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

## How to check work

Never call a visual change done without looking at it. Fast loop, cheapest first:
1. `npm run typecheck`.
2. Stills of the frames that changed, tiled into a contact sheet with ffmpeg
   (`-pattern_type glob ... -vf "scale=960:-1,tile=2x3"`), then read the sheet.
3. Audio: render `--codec=wav`, then measure (ebur128 loudness, RMS during vs.
   between speech) and draw a spectrogram on a linear axis.
4. Pages: `scripts/check-pages.mjs` / `check-preview.mjs`, then read the screenshots.

Full MP4 renders are slow (about 12 min for 48 s at 1080p); only render one when
a file is actually wanted.

## Working with the owner

- Wants bold, impressive work. Tasteful-but-safe first drafts were called
  "very average" and "not impressive enough": push depth, motion, light and a
  cinematic finish, and show real craft in the details.
- Prefers previews on a page over downloading files. Two private preview links,
  republished to the same URL after changes:
  Screening Room (videos and designs) https://claude.ai/artifact/KwRAsKmAEMQq8MqyFmesB1 ·
  design pages https://claude.ai/artifact/Ljwwi9GLwWSp35FjGYJsVZ.
- Wants learning content (the Calculus series) with the same level of polish.
- 2026-10-17 · Stopped the Calculus series at seven chapters (chapter 8, the quotient
  rule, was dropped after its narration draft) and asked for PR #1 to be merged, to
  start on "something better". Ask before extending the series again.
- Branch `claude/happy-wozniak-73ik3t`; PR
  [#1](https://github.com/johnsonnoronathan/the_most_beautiful_design/pull/1) is merged,
  so later work starts the branch again from `main`. Commit with clear messages and
  push when a piece of work is finished.
- 2026-10-20 · Wants the rendered films kept as a GitHub release. The owner starts the
  Render films workflow (`.github/workflows/render-films.yml`); add new films to
  `scripts/render-films.sh` and its release notes.

## Lessons learned

Add new lessons at the end of the matching group, dated. One or two lines each:
what went wrong or cost time, and what to do instead.

### Environment (cloud sandbox)

- 2026-10-13 · HuggingFace and GitHub downloads are blocked by policy (403);
  npm, PyPI, crates and the Go proxy are allowed. Look for model weights that
  ship inside packages: the Kokoro voice came from the `expo-kokoro` npm tarball.
- 2026-10-14 · Playwright's `proxy` option also proxies localhost (405 on local
  pages). Pass `--proxy-server=$HTTPS_PROXY` and
  `--proxy-bypass-list=localhost;127.0.0.1` as Chromium args instead.
- 2026-10-14 · espeak-ng silently falls back to a built-in path when its data
  path is longer than ~160 characters. Keep the data in `.cache/espeak-ng-data`.
- 2026-10-14 · kokoro-onnx 0.4.9 passes `speed` as int32 to models whose input is
  `input_ids`, but this export expects float. `narrate.py` calls the ONNX session
  directly (`synth()`).
- 2026-10-20 · `gh api` works through the proxy even though `gh auth status` calls the
  token invalid. But this session type may not create releases (403): the workflow does.

### Remotion

- 2026-10-13 · A global `Config.setCrf` breaks audio-only renders ("The wav codec
  does not support the --crf option"). Leave CRF at its default.
- 2026-10-13 · `remotion still` re-bundles every call (~5 s each); use
  `scripts/stills.mjs`, which bundles once for many frames.
- 2026-10-13 · Load fonts with `delayRender` at module scope; KaTeX's fonts also
  need `document.fonts.load(...)` before frames are captured, or the first frames
  use fallbacks.
- 2026-10-13 · KaTeX: standalone equations need `\displaystyle` (otherwise `\lim`
  puts its subscript inline). Display fractions are ~2.9 em tall: at 52 px, leave
  ≥ 180 px between stacked equation rows.
- 2026-10-13 · SVG `id`s must be unique per instance: the Screening Room shows a
  composition's Thumbnail and Player on one page. Prefix ids with `useId()`.
- 2026-10-13 · Heavy SVG filters (feTurbulence clouds, displacement ripples) cannot
  play in real time in the browser Player. Give such compositions a `quality:
  'preview' | 'final'` prop and pass `previewProps` from the catalog.
- 2026-10-14 · Import assets instead of `staticFile`: both Remotion's webpack and
  the Screening Room's esbuild turn imports into URLs, and project folders stay
  self-contained.
- 2026-10-14 · Zooming axes: fade ticks in by on-screen spacing, from a nested
  1-5-10 ladder. With 1-2-5, labels of two step sizes interleave (−0.6 −0.5 −0.4).
- 2026-10-14 · `Mono` labels are uppercase, which turns δ into Δ (a different
  symbol). Wrap Greek letters in a span with `textTransform: 'none'`.
- 2026-10-15 · A converging readout must show the limit's digits at its final step.
  It bit chapters 6 and 7 (1.080 vs 1.081, 2.224 vs 2.223): compute the final value in
  Python before rendering, and shrink further if the digits differ.
- 2026-10-15 · Slabs on every visible face of an isometric box hide the box itself.
  Float them just off the faces (exploded view) so the box and the missing edges show.

### Pages and artifacts

- 2026-10-13 · First drafts built without looking at a render were judged
  "average". Render and read a screenshot before presenting any design.
- 2026-10-13 · Published artifact pages get a doctype skeleton added; local tests
  must add one too, or KaTeX warns about quirks mode.
- 2026-10-14 · The HTML `hidden` attribute does not hide SVG elements; toggle
  `style.display`.
- 2026-10-14 · Design-canvas `.dc.html` files only run inside the canvas editor.
  To ship one as a page, rewrite it as standalone HTML/JS and keep the original
  in `canvas/`.
- 2026-10-14 · For a published preview of several pages, publish them as supporting
  HTML files with relative links and scripts, and use screenshot thumbnails rather
  than iframes of the pages (`scripts/build-design-preview.mjs`).
- 2026-10-14 · Local test servers must send `charset=utf-8`; without it `·` and `間`
  look garbled in screenshots, a false alarm (published pages get a charset).
- 2026-10-14 · A parent page cannot see whether a framed page loaded (a refused frame
  still fires `load`). Have the framed page `postMessage` when ready, and show its
  screenshot plus an "Open the page" link until then (Screening Room designs).
- 2026-10-14 · `loading="lazy"` images stay blank in full-page screenshots; scroll to
  the bottom first. Not a broken thumbnail.
- 2026-10-14 · ffmpeg `tile` contact sheets need `-frames:v 1 -update 1`, or ffmpeg
  refuses to write a single output image.

### Audio and voice

- 2026-10-13 · The assistant cannot listen. Verify audio by measurement: ebur128
  loudness, RMS in and out of speech, and spectrograms. ffmpeg's log-frequency
  spectrogram mislabels its axis; use a linear axis or check peaks with numpy.
- 2026-10-13 · Levels that work: film score −16 LUFS; background score under
  narration −19 LUFS; voice −16 LUFS; duck the music by ~40 % while speaking.
- 2026-10-14 · Write a separate spoken line for each caption (math read aloud),
  keep it inside its caption's time slot, and rewrite rather than speed it up by
  more than ~6 %.
- 2026-10-14 · Check phonemes for single letters and names before synthesizing:
  "A" alone is read as "uh" (spell it "Eigh"), "Leibniz" as "Laybniz" (spell it
  "Libenits").
- 2026-10-15 · Spoken lists ("sine, cosine, minus sine, …") run slow: each comma
  is a pause. Give a list line ~1 s more slot, borrowing from neighbours with slack.
- 2026-10-15 · To time a reveal to a spoken word, find word groups in
  `out/calculus-0N-voice.wav` from gaps (> 70 ms) in a 10 ms RMS envelope.

### Process

- 2026-10-13 · `__pycache__` got committed twice before it was ignored. Check
  `git status` before every commit.
- 2026-10-14 · When reorganising, use `git mv` so history follows the files, and
  re-run typecheck, stills, an audio render and the page checks afterwards.
- 2026-10-15 · A `sed` on `poster: 35 * FPS` in `catalog.ts` also changed chapter 2.
  Anchor catalog edits to the entry's `id`, and read `git diff` before committing.

## Keeping this file useful

- Before finishing a task, add any lesson that cost real time or came from the
  owner changing course. Date it, keep it to one or two lines, put it in the
  matching group.
- Fix or delete lessons that turn out to be wrong; keep the file short enough to
  read in a minute.
