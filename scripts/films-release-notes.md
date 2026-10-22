Rendered films from the studio, at 1920 × 1080, 30 fps, H.264 with AAC audio (music and narration mixed in).

## Calculus, visually · 7 chapters, 8:42

| File | Chapter | Length |
| --- | --- | --- |
| `calculus-visually-01-the-derivative.mp4` | 1 · The derivative | 1:08 |
| `calculus-visually-02-the-integral.mp4` | 2 · The integral | 1:04 |
| `calculus-visually-03-the-fundamental-theorem.mp4` | 3 · The fundamental theorem | 1:10 |
| `calculus-visually-04-the-limit.mp4` | 4 · The limit | 1:17 |
| `calculus-visually-05-sine-and-cosine.mp4` | 5 · Sine and cosine | 1:20 |
| `calculus-visually-06-the-chain-rule.mp4` | 6 · The chain rule | 1:22 |
| `calculus-visually-07-the-product-rule.mp4` | 7 · The product rule | 1:21 |

## Afterglow · 0:48

`afterglow.mp4`: one generated valley through a day of light, with its original score, rendered at final quality (full clouds, ripples and film grain).

## Re-rendering

Every film is code in this repository and can be rendered again from this release's commit:

```sh
npm install
scripts/render-films.sh          # all films → out/films/
npx remotion render Calculus-04-Limit out/calculus-04.mp4   # or just one
```
