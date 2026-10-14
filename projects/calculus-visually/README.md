# Calculus, visually

**Learning · video series · 3 chapters, 3:22**

A three-chapter tutorial in one visual language: the function is always amber,
slopes and derivatives teal, accumulated area coral.

1. **The derivative** (`Calculus-01-Derivative`, 1:08). A car travels
   `s(t) = t²`. Secant lines shrink into the tangent while a table of slopes
   closes in on 2; the algebra `((1+h)² − 1)/h = 2 + h` confirms it, and the
   tangent sweeps out `s′(t) = 2t`.
2. **The integral** (`Calculus-02-Integral`, 1:04). Distance from speed: a
   rectangle for constant speed, then 4 → 256 Riemann rectangles under
   `v(t) = t²` with a live convergence chart approaching 8/3, and Σ becoming ∫.
3. **The fundamental theorem** (`Calculus-03-Fundamental-Theorem`, 1:10). The
   area function `A(x)` is traced as the edge moves; a magnified sliver shows
   `dA/dx = f(x)`; the theorem turns chapter 2's 256 rectangles into one line:
   `∫₀² t² dt = [t³/3]₀² = 8/3`.

## Files

| Path | What it is |
| --- | --- |
| `kit.tsx` | Shared toolkit: plots, KaTeX equations, captions, title and recap cards, soundtrack with ducking |
| `Ch1Derivative.tsx`, `Ch2Integral.tsx`, `Ch3Fundamental.tsx` | One composition per chapter |
| `voice/chNN.json` | Narration script: on-screen caption (with math) and spoken wording per line |
| `voice/chNN.timing.json` | When speech happens, written by `narrate.py`; the music dips under it |
| `voice/narrate.py` | Synthesizes the voiceover |
| `score/compose.py` | Synthesizes the background music |
| `assets/` | `chNN-score.mp3` and `chNN-voice.mp3` per chapter |

## Music

Each chapter has its own score, quieter than Afterglow's so it sits under the
narration. A shared four-note motif opens every chapter and is answered on its
closing card; chords change with the scenes; small accents mark the reveals (a
rising note per table row in chapter 1, per doubling of the rectangles in
chapter 2, a cascade on the final 8/3 in chapter 3).

```sh
python3 projects/calculus-visually/score/compose.py   # → assets/chNN-score.mp3
```

## Voiceover

An offline neural voice (Kokoro-82M, Apache-2.0, voice `af_heart`) reads each
line, starting as its caption appears. A line is sped up slightly (at most 15 %)
only if it would run into the next one. A few words are respelled in the spoken
text only so the phonemizer says them right ("Eigh" for the letter A,
"Libenits" for Leibniz).

```sh
scripts/setup-tts.sh                                   # once: model from npm, runtime from PyPI, into .cache/
.cache/tts/venv/bin/python projects/calculus-visually/voice/narrate.py   # → assets/chNN-voice.mp3
```
