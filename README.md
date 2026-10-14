# The Most Beautiful Design

A studio of things made entirely from code: films, tutorials and pages. Each
project lives in its own folder under [`projects/`](projects/), named after the
project, with everything it needs inside it.

| Project | Folder | Category | Kind |
| --- | --- | --- | --- |
| **Calculus, visually** | [`projects/calculus-visually`](projects/calculus-visually/) | Learning | Video series, 3 chapters (3:22), narrated and scored |
| **Afterglow** | [`projects/afterglow`](projects/afterglow/) | Art | Film (0:48) with an original score |
| **Screening Room** | [`projects/screening-room`](projects/screening-room/) | Page | Live previews of every video, shelved by category |
| **Afterglow Studies** | [`projects/afterglow-studies`](projects/afterglow-studies/) | Design | Pages: poster, interactive day of light, four-hours series |
| **Ma 間** | [`projects/ma`](projects/ma/) | Design | Pages: poster, working timer app, principles sheet |

## Quick start

```sh
npm install
npm run screening-room   # → out/screening-room/index.html: watch every video live, no rendering
npm run studio           # Remotion Studio: scrub and edit the videos
npx remotion render Calculus-01-Derivative out/calculus-01.mp4   # an MP4, only when you need a file
open projects/ma/index.html  # design pages open directly in a browser
```

To use a Chromium that is already installed (for example in a sandbox), set
`REMOTION_BROWSER` to its executable. `npm run stills -- Afterglow:960` renders
single frames, the quickest way to check a change.

## Layout

```
projects/                      one folder per project, named after it
  calculus-visually/           chapters, plotting kit, assets/, score/, voice/
  afterglow/                   the film, its landscape engine, assets/, score/
  screening-room/              the preview page and its build
  afterglow-studies/           design pages: poster, day of light, four hours (+ canvas/ source)
  ma/                          design pages: poster, timer app, principles (+ canvas/ source)
studio/                        shared by every project (not a project itself)
  index.ts, Root.tsx           Remotion entry; Studio folders mirror the catalog
  catalog.ts                   every video, its category and its project folder
  lib/fonts.ts, lib/synth.py   typefaces and the music synthesizer
  fonts/                       Bodoni Moda, Geist, Geist Mono (SIL OFL)
scripts/                       stills renderer, page and Screening Room smoke tests, voice setup
CLAUDE.md                      how to work in this repo, and the lessons learned so far
```

Assets are imported from each project's own `assets/` folder (no shared
`public/` directory), so a project folder can be moved, copied or deleted as a
unit.

## Adding a project

1. Create `projects/<project-name>/`, using the project's name in lower case
   with hyphens (`Calculus, visually` → `calculus-visually`).
2. Add a short `README.md` saying what it is.
3. **A video:** put its compositions in the folder and list them in
   `studio/catalog.ts` with the project's `id` set to the folder name. It then
   appears in Remotion Studio and on the Screening Room shelves.
   **A page:** plain `index.html` plus pages that open directly in a browser
   (like `projects/ma/`), or a `build.mjs` that writes to `out/<project-name>/`
   (like `projects/screening-room/`). Check it with
   `node scripts/check-pages.mjs projects/<project-name>`.
4. Add a row to the table above.
