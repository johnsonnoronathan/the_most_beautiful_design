# Afterglow

**Art · film · 0:48**

One generated valley through one day of light. Eighteen procedurally generated
ridgelines recede into haze above a lake that mirrors them. Everything is code
and deterministic per frame: the sky palette moves through ten lighting moods,
the sun and moon cross the sky, clouds drift (SVG fractal noise), the
reflection ripples, light rays turn at sunrise and sunset, glitter tracks the
sun and moon on the water, fireflies come out at dusk, birds cross at morning
and golden hour, and shooting stars fall at night. Letterboxed 2.39:1 with a
live clock, film grain and a vignette.

## Files

| Path | What it is |
| --- | --- |
| `Afterglow.tsx` | The film: hour curve, camera, captions, title sequence, letterbox. Takes `quality: 'preview' \| 'final'` |
| `Valley.tsx` | The scene as a pure function of frame, hour and camera pan |
| `engine.ts` | Seeded geometry (ridges, pines, stars, glitter, rays, fireflies, reeds) and the hour → palette model |
| `score/compose.py` | The original score, synthesized with numpy and timed to the film |
| `assets/` | `grain.png` (film grain) and `score.mp3` |

```sh
npx remotion render Afterglow out/afterglow.mp4
python3 projects/afterglow/score/compose.py
ffmpeg -i out/afterglow-score.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 \
  -ar 48000 -c:a libmp3lame -b:a 192k projects/afterglow/assets/score.mp3
```
