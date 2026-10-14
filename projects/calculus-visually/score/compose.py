"""Calculus, visually: background scores for the three chapters.

Each chapter shares one four-note series motif (heard on the title card and
answered on the closing "Key idea" card), a soft pad bed whose chords change
with the scenes, a quiet felt-piano pattern, and small accents on the reveals
(table rows, each doubling of the rectangles, boxed results).

    python3 projects/calculus-visually/score/compose.py
    → out/calculus-0N-score.wav and projects/calculus-visually/assets/ch0N-score.mp3
"""

import math
import os
import sys

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'studio', 'lib'))

import synth as s  # noqa: E402

VOICINGS = {
    # D major (chapters 1 and 3)
    'D': ['D2', 'A2', 'D3', 'F#3', 'A3'],
    'Dadd9': ['D2', 'A2', 'E3', 'F#3', 'A3'],
    'Dmaj7': ['D2', 'A2', 'F#3', 'A3', 'C#4'],
    'Dmaj9': ['D2', 'A2', 'F#3', 'C#4', 'E4'],
    'Bm9': ['B1', 'F#2', 'D3', 'A3', 'C#4'],
    'Gmaj7': ['G2', 'D3', 'F#3', 'B3'],
    'Gmaj9': ['G2', 'D3', 'F#3', 'A3', 'B3'],
    'Gmaj7#11': ['G2', 'D3', 'F#3', 'B3', 'C#4'],
    'A6': ['A2', 'E3', 'F#3', 'C#4'],
    'A9sus': ['A2', 'E3', 'G3', 'B3', 'D4'],
    'A13': ['A2', 'G3', 'C#4', 'F#4'],
    'Em9': ['E2', 'B2', 'D3', 'F#3', 'G3'],
    'F#m7': ['F#2', 'C#3', 'E3', 'A3'],
    # F major (chapter 2)
    'Fadd9': ['F2', 'C3', 'G3', 'A3', 'C4'],
    'Fmaj7': ['F2', 'C3', 'E3', 'A3'],
    'Fmaj9': ['F2', 'C3', 'A3', 'E4', 'G4'],
    'Dm9': ['D2', 'A2', 'F3', 'C4', 'E4'],
    'Bbmaj7': ['Bb2', 'F3', 'A3', 'D4'],
    'Bbmaj9': ['Bb2', 'F3', 'A3', 'C4', 'D4'],
    'C6': ['C3', 'G3', 'A3', 'E4'],
    'Gm9': ['G2', 'D3', 'F3', 'Bb3', 'A4'],
    'C9sus': ['C3', 'G3', 'Bb3', 'D4', 'F4'],
}

MOTIF = {'D': ['A4', 'D5', 'E5', 'F#5'], 'F': ['C5', 'F5', 'G5', 'A5']}
ANSWER = {'D': ['F#5', 'E5', 'D5', 'A4'], 'F': ['A5', 'G5', 'F5', 'C5']}
EIGHTH = 60 / 84 / 2


def arp_tones(chord):
    """Chord tones lifted into the A3–A5 range for the piano pattern."""
    lo, hi = s.hz('A3'), s.hz('A5')
    out = []
    for n in VOICINGS[chord]:
        f = s.hz(n)
        while f < lo:
            f *= 2
        if f <= hi and all(abs(f / g - 1) > 0.01 for g in out):
            out.append(f)
    return sorted(out)


def h_crossing_times():
    """When chapter 1's shrinking h passes each table row (1, 0.5, 0.1, 0.01, 0.001)."""
    times = []
    for r in (1, 0.5, 0.1, 0.01, 0.001):
        e = min(1.0, math.log10(2 / r) / 3.3)  # eased progress at which h = r
        p = math.acos(1 - 2 * e) / math.pi    # invert ease-in-out-sine
        times.append(26 + 11 * p)
    return times


def score(spec):
    s.reseed(spec['seed'])
    dur = spec['seconds']
    pads, keys, bells, fx = (s.buffer(dur) for _ in range(4))

    chords = spec['chords']
    for start, end, name, bright, level in chords:
        notes = VOICINGS[name]
        for i, note in enumerate(notes):
            mono = s.pad_note(s.hz(note), end - start, brightness=bright) * level
            s.add(pads, start, s.pan(mono, (i / max(1, len(notes) - 1) - 0.5) * 0.7))

    def chord_at(t):
        name = chords[0][2]
        for start, _, n, _, _ in chords:
            if start <= t:
                name = n
        return name

    pattern = [0, 2, 1, 3, 2, 1, 4, 2]
    for a, z, level in spec['arp']:
        t, step = a, 0
        while t < z:
            tones = arp_tones(chord_at(t))
            f = tones[pattern[step % len(pattern)] % len(tones)]
            vel = level * (0.8 + 0.2 * math.sin(step * 0.7)) * (1.12 if step % 8 == 0 else 1.0)
            s.add(keys, t + 0.01 * (s.rand() - 0.5), s.pan(s.piano_note(f, vel), (s.rand() - 0.5) * 0.5))
            t += EIGHTH
            step += 1

    key = spec['key']
    for i, note in enumerate(MOTIF[key]):
        t = spec['motif_at'] + i * 0.42
        s.add(bells, t, s.pan(s.bell(s.hz(note), 0.5), -0.3 + i * 0.2))
        s.add(keys, t, s.pan(s.piano_note(s.hz(note), 0.45), -0.3 + i * 0.2))
    for i, note in enumerate(ANSWER[key]):
        t = spec['answer_at'] + i * 0.5
        s.add(bells, t, s.pan(s.bell(s.hz(note), 0.45), 0.3 - i * 0.2))
        s.add(keys, t, s.pan(s.piano_note(s.hz(note), 0.4), 0.3 - i * 0.2))

    for t, notes, voice, vel in spec['accents']:
        for j, note in enumerate(notes):
            f = s.hz(note)
            if voice == 'bell':
                s.add(bells, t + j * 0.02, s.pan(s.bell(f, vel), (s.rand() - 0.5) * 0.8))
            else:
                s.add(keys, t + j * 0.02, s.pan(s.piano_note(f, vel), (s.rand() - 0.5) * 0.6))

    for t, notes in spec.get('cascades', []):
        for j, note in enumerate(notes):
            s.add(bells, t + j * 0.09, s.pan(s.bell(s.hz(note), 0.42), -0.6 + j * 0.25))

    for end, length in spec.get('swells', []):
        s.add(fx, end - length, s.pan(s.swell(length) * 0.14, 0))

    for t, root in spec.get('booms', []):
        n = int(5 * s.SR)
        tt = np.arange(n) / s.SR
        f = s.hz(root)
        boom = (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * 0.9) * np.clip(tt / 0.08, 0, 1)
        s.add(fx, t, s.pan(boom * 0.3, 0))

    ir = s.reverb_ir()
    mix = (
        pads * 0.5 + s.convolve(pads, ir) * 0.45
        + keys * 0.5 + s.convolve(keys, ir) * 0.5
        + bells * 0.32 + s.convolve(bells, ir) * 0.7
        + fx * 0.6 + s.convolve(fx, ir) * 0.5
    )
    return s.master(mix, fade_in=0.8, fade_out=2.2)


ROWS = h_crossing_times()

CHAPTERS = {
    1: {
        'seed': 101,
        'seconds': 68,
        'key': 'D',
        'motif_at': 0.7,
        'answer_at': 63.9,
        'chords': [
            (0.0, 4.8, 'Dmaj9', 0.35, 0.9),
            (4.6, 9.8, 'Dmaj7', 0.45, 0.8),
            (9.6, 15.2, 'Bm9', 0.45, 0.8),
            (15.0, 20.4, 'Gmaj7', 0.5, 0.8),
            (20.2, 25.2, 'A6', 0.5, 0.8),
            (25.0, 31.2, 'Em9', 0.45, 0.8),
            (31.0, 35.2, 'F#m7', 0.5, 0.8),
            (35.0, 37.8, 'Gmaj7#11', 0.55, 0.85),
            (37.6, 40.2, 'Dadd9', 0.6, 0.9),     # the secant becomes the tangent
            (40.0, 46.2, 'Bm9', 0.4, 0.75),      # algebra
            (46.0, 48.6, 'Gmaj9', 0.45, 0.75),
            (48.4, 52.4, 'Dmaj9', 0.55, 0.85),   # boxed 2 m/s
            (52.2, 57.2, 'Dmaj7', 0.5, 0.8),
            (57.0, 63.4, 'Gmaj9', 0.5, 0.8),
            (63.2, 68.0, 'Dmaj9', 0.4, 0.9),
        ],
        'arp': [(5.2, 40.0, 0.3), (52.6, 63.0, 0.3)],
        'accents': [
            *[(t, [n], 'bell', 0.32) for t, n in zip(ROWS, ['A5', 'B5', 'D6', 'E6', 'F#6'])],
            (37.6, ['A5', 'D6'], 'bell', 0.45),
            (40.6, ['A4'], 'piano', 0.5),
            (42.0, ['B4'], 'piano', 0.5),
            (43.8, ['D5'], 'piano', 0.5),
            (45.8, ['E5'], 'piano', 0.5),
            (48.4, ['D5', 'F#5', 'A5'], 'bell', 0.4),
            (61.4, ['A5'], 'bell', 0.32),
        ],
    },
    2: {
        'seed': 202,
        'seconds': 64,
        'key': 'F',
        'motif_at': 0.7,
        'answer_at': 58.3,
        'chords': [
            (0.0, 4.8, 'Fmaj9', 0.35, 0.9),
            (4.6, 10.0, 'Fmaj7', 0.45, 0.8),
            (9.8, 15.2, 'Dm9', 0.45, 0.8),
            (15.0, 19.2, 'Bbmaj7', 0.5, 0.8),
            (19.0, 22.8, 'C6', 0.5, 0.8),
            (22.6, 27.2, 'Dm9', 0.45, 0.8),      # rectangles begin
            (27.0, 32.4, 'Bbmaj9', 0.5, 0.8),
            (32.2, 37.2, 'Gm9', 0.5, 0.8),
            (37.0, 39.2, 'C9sus', 0.55, 0.85),
            (39.0, 42.2, 'Fadd9', 0.6, 0.9),     # the sum settles at 8/3
            (42.0, 47.2, 'Fmaj9', 0.5, 0.8),
            (47.0, 52.7, 'Dm9', 0.45, 0.8),
            (52.5, 55.2, 'Bbmaj9', 0.5, 0.8),
            (55.0, 57.7, 'Fmaj9', 0.55, 0.85),
            (57.5, 64.0, 'Fmaj9', 0.4, 0.9),
        ],
        'arp': [(5.2, 42.0, 0.3), (47.0, 57.0, 0.28)],
        'accents': [
            # one rising note for each doubling: 4, 8, 16, … 256 slices
            *[(t, [n], 'bell', 0.3) for t, n in zip([22.6, 26.6, 29.6, 32.2, 34.6, 37.0, 39.0], ['F5', 'G5', 'A5', 'C6', 'D6', 'F6', 'G6'])],
            (39.3, ['F5', 'A5', 'C6'], 'bell', 0.36),
            (46.4, ['F6'], 'bell', 0.32),
            (50.6, ['C5'], 'piano', 0.45),
            (53.0, ['F5', 'A5'], 'bell', 0.38),
        ],
        'swells': [(46.4, 1.6)],
    },
    3: {
        'seed': 303,
        'seconds': 70,
        'key': 'D',
        'motif_at': 0.7,
        'answer_at': 64.0,
        'chords': [
            (0.0, 4.8, 'Dmaj9', 0.35, 0.9),
            (4.6, 9.6, 'Dmaj7', 0.45, 0.8),
            (9.4, 15.2, 'Gmaj9', 0.5, 0.8),
            (15.0, 20.2, 'Em9', 0.45, 0.8),      # the question
            (20.0, 25.2, 'Bm9', 0.45, 0.8),
            (25.0, 30.2, 'Gmaj7', 0.5, 0.8),
            (30.0, 33.4, 'A9sus', 0.5, 0.8),
            (33.2, 35.2, 'Dadd9', 0.6, 0.9),     # boxed dA/dx = f(x)
            (35.0, 38.4, 'Gmaj7', 0.5, 0.8),
            (38.2, 43.6, 'Dmaj9', 0.6, 1.0),     # the theorem
            (43.4, 48.2, 'Bm9', 0.5, 0.85),
            (48.0, 50.7, 'Gmaj9', 0.5, 0.85),
            (50.5, 52.4, 'A13', 0.5, 0.85),
            (52.2, 57.6, 'D', 0.55, 0.9),
            (57.4, 60.2, 'Gmaj9', 0.5, 0.85),
            (60.0, 63.4, 'Dmaj9', 0.5, 0.85),
            (63.2, 70.0, 'Dmaj9', 0.4, 1.0),
        ],
        'arp': [(5.2, 38.0, 0.3), (43.6, 52.2, 0.28), (57.6, 63.0, 0.28)],
        'accents': [
            (22.0, ['D5'], 'piano', 0.45),
            (28.0, ['A4'], 'piano', 0.45),
            (30.4, ['B4'], 'piano', 0.45),
            (33.2, ['A5', 'D6'], 'bell', 0.42),
            (35.4, ['F#5'], 'bell', 0.32),
            (38.6, ['D5', 'A5'], 'bell', 0.42),
            (43.6, ['F#5', 'A5'], 'bell', 0.36),
            (52.6, ['A4'], 'piano', 0.45),
            (54.0, ['B4'], 'piano', 0.45),
            (55.4, ['D5'], 'piano', 0.45),
            (66.2, ['D4', 'D5'], 'bell', 0.4),   # last word of the series
        ],
        'cascades': [(56.8, ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6'])],
        'swells': [(38.6, 1.8)],
        'booms': [(38.6, 'D1')],
    },
}

if __name__ == '__main__':
    for n, spec in CHAPTERS.items():
        wav = os.path.join(ROOT, 'out', f'calculus-0{n}-score.wav')
        mp3 = os.path.join(ROOT, 'projects', 'calculus-visually', 'assets', f'ch0{n}-score.mp3')
        s.write_wav(wav, score(spec))
        # quieter than Afterglow: this sits under captions people are reading
        s.encode_mp3(wav, mp3, lufs=-19)
        print('wrote', os.path.relpath(mp3, ROOT))
