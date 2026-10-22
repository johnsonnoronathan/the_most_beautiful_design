# The Most Beautiful Design

A studio of things made entirely from code: films, tutorials and pages. Each
project lives in its own folder under [`projects/`](projects/), named after the
project, with everything it needs inside it.

| Project | Folder | Category | Kind |
| --- | --- | --- | --- |
| **Calculus, visually** | [`projects/calculus-visually`](projects/calculus-visually/) | Learning | Video series, 7 chapters (8:42), narrated and scored |
| **Afterglow** | [`projects/afterglow`](projects/afterglow/) | Art | Film (0:48) with an original score |
| **Screening Room** | [`projects/screening-room`](projects/screening-room/) | Page | Every project live, shelved by category: videos play, designs work on the stage |
| **Afterglow Studies** | [`projects/afterglow-studies`](projects/afterglow-studies/) | Design | Pages: poster, interactive day of light, four-hours series |
| **Ma 間** | [`projects/ma`](projects/ma/) | Design | Pages: poster, working timer app, principles sheet |

## Quick start

```sh
npm install
npm run screening-room   # → out/screening-room/index.html: every video and design, live, no rendering
npm run studio           # Remotion Studio: scrub and edit the videos
npx remotion render Calculus-01-Derivative out/calculus-01.mp4   # an MP4, only when you need a file
scripts/render-films.sh  # every film as an MP4 → out/films/
open projects/ma/index.html  # design pages open directly in a browser
node scripts/build-design-preview.mjs   # → out/design-preview/: one gallery of every design page
```

Rendered films are published as GitHub releases by the **Render films** workflow
(Actions → Render films → Run workflow, about 35 minutes), which runs
`scripts/render-films.sh` on GitHub's machines and attaches the MP4s to the release.

To use a Chromium that is already installed (for example in a sandbox), set
`REMOTION_BROWSER` to its executable. `npm run stills -- Afterglow:960` renders
single frames, the quickest way to check a change.

## Layout

```
projects/                      one folder per project, named after it
  calculus-visually/           chapters, plotting kit, assets/, score/, voice/
  afterglow/                   the film, its landscape engine, assets/, score/
  screening-room/              the preview page and its build
  afterglow-studies/           design pages: poster, day of light, four hours (+ pages.json, canvas/ source)
  ma/                          design pages: poster, timer app, principles (+ pages.json, canvas/ source)
studio/                        shared by every project (not a project itself)
  index.ts, Root.tsx           Remotion entry; Studio folders mirror the catalog
  catalog.ts                   every video and design, its category and its project folder
  lib/fonts.ts, lib/synth.py   typefaces and the music synthesizer
  fonts/                       Bodoni Moda, Geist, Geist Mono (SIL OFL)
scripts/                       stills, film renders, page thumbnails, smoke tests, voice setup
.github/workflows/             Render films: every film as an MP4, attached to a release
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
   **A design for the Screening Room:** describe each page in the project's
   `pages.json`, take its thumbnails with
   `node scripts/page-thumbs.mjs projects/<project-name>`, and add the project to
   the Design category in `studio/catalog.ts`.
4. Add a row to the table above.
