# Screening Room

**Page · live previews of every video**

One page that plays every composition live in the browser with the Remotion
Player, so nothing needs rendering or downloading. Videos are shelved by
category (Learning, Art) from `studio/catalog.ts`; a new video listed there
appears here on the next build.

```sh
npm run screening-room              # → out/screening-room/index.html, audio in out/screening-room/media/
node scripts/check-preview.mjs      # headless smoke test: errors, audio requests, phone-width overflow
```

## Files

| Path | What it is |
| --- | --- |
| `main.tsx` | The page: player, chapter list, export command, shelves with live thumbnails |
| `page.css` | Its styles (a single dark look, for watching video) |
| `build.mjs` | Bundles everything with esbuild into one page; fonts and textures inlined, audio beside it |
