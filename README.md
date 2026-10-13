# Afterglow

A 48-second film of one generated valley through one day of light, built with
[Remotion](https://www.remotion.dev/).

Eighteen procedurally generated ridgelines recede into haze above a lake that
mirrors them. Everything is code and deterministic per frame: the sky palette
interpolates through ten lighting moods, the sun and moon cross the sky, clouds
drift (SVG fractal noise), the reflection ripples, light rays turn at sunrise
and sunset, glitter tracks the sun and moon on the water, fireflies come out at
dusk, birds cross at morning and golden hour, and a shooting star or two falls
at night. Letterboxed 2.39:1 with a live clock, film grain and a vignette.

## Run

```sh
npm install
npm run studio   # preview and scrub in the browser
npm run render   # writes out/afterglow.mp4 (1920×1080, 30 fps)
```

If you need to use a Chromium that is already installed (for example in a
sandbox), set `REMOTION_BROWSER` to its executable before rendering.

## Files

- `src/engine.ts` — seeded geometry (ridges, pines, stars, glitter, rays,
  fireflies, reeds) and the hour → palette model.
- `src/Valley.tsx` — the scene as a pure function of frame, hour and camera pan.
- `src/Afterglow.tsx` — the timeline: hour curve, camera push-in, captions,
  title sequence, letterbox and HUD.
- `public/` — bundled fonts (Bodoni Moda, Geist, Geist Mono; SIL OFL) and the
  grain texture.
