# Screening Room

**Page · every project, live**

One page that plays every composition live in the browser with the Remotion
Player and shows every design page working on the same stage, so nothing needs
rendering or downloading. Projects are shelved by category (Learning, Art,
Design) from `studio/catalog.ts`; a new video or design listed there appears
here on the next build.

A design loads in a frame (`pages/<project>/<page>#stage`, which keeps the
page's own tools and drops its back link). Its screenshot holds the place until
the page posts `design-ready`; if that never comes, for example on a host that
refuses frames, the screenshot stays with a link to open the page.

```sh
npm run screening-room              # → out/screening-room/index.html, media/ (audio), pages/ (designs)
node scripts/check-preview.mjs      # headless smoke test: errors, audio requests, phone-width overflow
node scripts/check-preview.mjs ma-timer   # the same with a design on the stage (reports its state)
```

## Files

| Path | What it is |
| --- | --- |
| `main.tsx` | The page: player or live design, chapter and design lists, export command, shelves |
| `page.css` | Its styles (a single dark look, for watching films and looking at designs) |
| `build.mjs` | Bundles everything with esbuild into one page (fonts and textures inlined, audio beside it) and copies the design pages and thumbnails into `pages/` |
