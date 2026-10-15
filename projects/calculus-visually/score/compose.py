"""Calculus, visually: background scores for the seven chapters.

Each chapter shares one four-note series motif (heard on the title card and
answered on the closing "Key idea" card), a soft pad bed whose chords change
with the scenes, a quiet felt-piano pattern, and small accents on the reveals
(table rows, each doubling of the rectangles, zoom levels, boxed results).

    python3 projects/calculus-visually/score/compose.py [1 2 3 4]
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
    # G major (chapter 4)
    'G': ['G2', 'D3', 'G3', 'B3', 'D4'],
    'Gadd9': ['G2', 'D3', 'A3', 'B3', 'D4'],
    'Cmaj7': ['C3', 'G3', 'B3', 'E4'],
    'Cmaj9': ['C3', 'G3', 'B3', 'D4', 'E4'],
    'Cmaj7#11': ['C3', 'G3', 'B3', 'F#4'],
    'Am9': ['A2', 'E3', 'G3', 'B3', 'C4'],
    'D9sus': ['D3', 'A3', 'C4', 'E4', 'G4'],
    'Bm7': ['B2', 'F#3', 'A3', 'D4'],
    # A major (chapter 5)
    'Amaj7': ['A2', 'E3', 'G#3', 'C#4'],
    'Amaj9': ['A2', 'E3', 'G#3', 'B3', 'C#4'],
    'Aadd9': ['A2', 'E3', 'B3', 'C#4', 'E4'],
    'F#m9': ['F#2', 'C#3', 'E3', 'G#3', 'A3'],
    'E9sus': ['E2', 'B2', 'D3', 'F#3', 'A3'],
    'C#m7': ['C#3', 'G#3', 'B3', 'E4'],
    'E6': ['E2', 'B2', 'C#3', 'G#3'],
    # B-flat major (chapter 6)
    'Bbadd9': ['Bb2', 'F3', 'C4', 'D4', 'F4'],
    'Ebmaj7': ['Eb3', 'Bb3', 'D4', 'G4'],
    'Ebmaj9': ['Eb2', 'Bb2', 'D3', 'F3', 'G3'],
    'Cm9': ['C3', 'G3', 'Bb3', 'D4', 'Eb4'],
    'F9sus': ['F2', 'C3', 'Eb3', 'G3', 'Bb3'],
    # C major (chapter 7)
    'Cadd9': ['C3', 'G3', 'D4', 'E4', 'G4'],
    'G9sus': ['G2', 'D3', 'F3', 'A3', 'C4'],
    'Em7': ['E2', 'B2', 'D3', 'G3'],
}

MOTIF = {'D': ['A4', 'D5', 'E5', 'F#5'], 'F': ['C5', 'F5', 'G5', 'A5'], 'G': ['D5', 'G5', 'A5', 'B5'], 'A': ['E5', 'A5', 'B5', 'C#6'], 'Bb': ['F5', 'Bb5', 'C6', 'D6'], 'C': ['G4', 'C5', 'D5', 'E5']}
ANSWER = {'D': ['F#5', 'E5', 'D5', 'A4'], 'F': ['A5', 'G5', 'F5', 'C5'], 'G': ['B5', 'A5', 'G5', 'D5'], 'A': ['C#6', 'B5', 'A5', 'E5'], 'Bb': ['D6', 'C6', 'Bb5', 'F5'], 'C': ['E5', 'D5', 'C5', 'G4']}
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


def inv_inout_sine(e):
    """Progress at which Remotion's Easing.inOut(Easing.sin) reaches e."""
    return math.acos(1 - 2 * e) / math.pi


def walk_crossing_times():
    """When chapter 4's walkers (6 → 0.0008 over 19.6–23.8 s) pass each table row."""
    return [19.6 + 4.2 * inv_inout_sine(math.log10(6 / r) / 3.9) for r in (1, 0.1, 0.01, 0.001)]


def zoom_times():
    """When chapter 4's zoom (×1 → ×1000 over 24.6–29.4 s) reaches ×10, ×100 and ×1000."""
    return [24.6 + 4.8 * inv_inout_sine(k / 3) for k in (1, 2, 3)]


def sweep_times():
    """When chapter 5's tangent (0 → 2π over 10.4–15.2 s) reaches π/2, π, 3π/2 and 2π."""
    return [10.4 + 4.8 * inv_inout_sine(e) for e in (0.25, 0.5, 0.75, 1.0)]


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
WALK = walk_crossing_times()
ZOOM = zoom_times()
SWEEP = sweep_times()

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
            (66.2, ['D4', 'D5'], 'bell', 0.4),
        ],
        'cascades': [(56.8, ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6'])],
        'swells': [(38.6, 1.8)],
        'booms': [(38.6, 'D1')],
    },
    4: {
        'seed': 404,
        'seconds': 77,
        'key': 'G',
        'motif_at': 0.7,
        'answer_at': 71.3,
        'chords': [
            (0.0, 4.8, 'Gmaj9', 0.35, 0.9),
            (4.6, 9.8, 'Gmaj7', 0.45, 0.8),      # three chapters, one move
            (9.6, 12.2, 'Cmaj9', 0.5, 0.8),
            (12.0, 14.4, 'Gadd9', 0.6, 0.9),     # lim
            (14.2, 19.4, 'Em9', 0.45, 0.8),      # the hole
            (19.2, 24.4, 'Cmaj7', 0.5, 0.8),     # walking in
            (24.2, 27.4, 'Am9', 0.45, 0.8),      # zoom
            (27.2, 30.2, 'D9sus', 0.55, 0.85),
            (30.0, 34.8, 'Gadd9', 0.6, 0.95),    # the limit is 1
            (34.6, 39.8, 'Em9', 0.45, 0.8),      # the challenge
            (39.6, 45.0, 'Cmaj7', 0.5, 0.8),
            (44.8, 50.2, 'Am9', 0.5, 0.8),
            (50.0, 52.8, 'Bm7', 0.5, 0.8),
            (52.6, 55.4, 'D9sus', 0.55, 0.85),
            (55.2, 60.4, 'Gmaj9', 0.6, 1.0),     # the definition
            (60.2, 65.4, 'Cmaj7#11', 0.5, 0.85), # a jump: left unresolved
            (65.2, 68.2, 'Am9', 0.45, 0.8),
            (68.0, 70.8, 'D9sus', 0.5, 0.85),
            (70.6, 77.0, 'Gmaj9', 0.4, 1.0),
        ],
        'arp': [(5.2, 14.0, 0.28), (14.6, 34.6, 0.3), (39.6, 55.0, 0.28), (60.6, 70.2, 0.26)],
        'accents': [
            (12.0, ['G5', 'B5', 'D6'], 'bell', 0.38),
            (17.0, ['B4'], 'piano', 0.45),
            (17.0, ['D6'], 'bell', 0.3),
            *[(t, [n], 'bell', 0.3) for t, n in zip(WALK, ['G5', 'A5', 'B5', 'D6'])],
            *[(t, [n], 'bell', 0.3) for t, n in zip(ZOOM, ['D6', 'E6', 'G6'])],
            (30.4, ['G5', 'B5', 'D6'], 'bell', 0.4),
            (39.8, ['E5'], 'piano', 0.42),
            (45.0, ['B4'], 'piano', 0.42),
            # the band thins: each settled round a step lower
            (46.4, ['D6'], 'bell', 0.3),
            (52.0, ['B5'], 'bell', 0.3),
            (54.6, ['G5'], 'bell', 0.3),
            (55.8, ['G5', 'D6'], 'bell', 0.42),
            (61.4, ['E4'], 'piano', 0.45),
            (66.4, ['A4'], 'piano', 0.45),
            (68.4, ['F#4'], 'piano', 0.45),
            (69.0, ['E5', 'A5'], 'bell', 0.35),
            (74.6, ['G4', 'G5'], 'bell', 0.4),
        ],
        'swells': [(29.4, 2.0), (55.8, 1.6)],
        'booms': [(55.8, 'G1')],
    },
    5: {
        'seed': 505,
        'seconds': 80,
        'key': 'A',
        'motif_at': 0.7,
        'answer_at': 73.5,
        'chords': [
            (0.0, 4.8, 'Amaj9', 0.35, 0.9),
            (4.6, 9.8, 'Amaj7', 0.45, 0.8),      # sin x
            (9.6, 15.4, 'F#m9', 0.45, 0.8),      # the tangent rides the wave
            (15.2, 20.0, 'Dmaj9', 0.55, 0.9),    # it is cos x
            (19.8, 25.4, 'E9sus', 0.5, 0.8),     # chapter 4's limit
            (25.2, 30.4, 'Aadd9', 0.5, 0.85),    # the circle
            (30.2, 35.4, 'C#m7', 0.5, 0.8),
            (35.2, 40.6, 'F#m9', 0.5, 0.8),      # one turn
            (40.4, 43.8, 'Dmaj7', 0.5, 0.8),
            (43.6, 46.2, 'Aadd9', 0.6, 0.95),    # the triangle lands
            (46.0, 51.8, 'Dmaj9', 0.5, 0.85),
            (51.6, 57.2, 'E9sus', 0.5, 0.8),     # the wheel
            (57.0, 62.2, 'F#m9', 0.5, 0.8),
            (62.0, 67.8, 'Dmaj9', 0.55, 0.9),    # f'' = -f
            (67.6, 73.0, 'E6', 0.5, 0.85),       # the spring
            (72.8, 80.0, 'Amaj9', 0.4, 1.0),
        ],
        'arp': [(5.2, 25.0, 0.28), (27.0, 51.4, 0.28), (52.0, 72.4, 0.27)],
        'accents': [
            *[(t, [n], 'bell', 0.3) for t, n in zip(SWEEP, ['C#6', 'E6', 'C#6', 'A5'])],
            (15.6, ['A5', 'C#6', 'E6'], 'bell', 0.38),
            (21.0, ['E5'], 'piano', 0.45),
            (27.2, ['A5'], 'bell', 0.3),
            (30.6, ['C#5'], 'piano', 0.42),
            (32.3, ['E5'], 'piano', 0.42),
            (35.6, ['B5'], 'bell', 0.3),
            (40.4, ['A5', 'E6'], 'bell', 0.35),
            (43.6, ['A5', 'C#6', 'E6'], 'bell', 0.4),
            (46.6, ['A4'], 'piano', 0.45),
            (49.0, ['C#5'], 'piano', 0.45),
            # the four stations as they are named, then each quarter turn as it lands
            *[(t, [n], 'bell', 0.32) for t, n in zip([53.3, 53.9, 54.6, 55.3, 56.5], ['A5', 'C#6', 'E6', 'F#6', 'A6'])],
            *[(t + 0.8, [n], 'bell', 0.3) for t, n in zip([57.6, 58.8, 60.0, 61.2], ['C#6', 'E6', 'F#6', 'A6'])],
            (62.0, ['A5', 'C#6', 'E6'], 'bell', 0.36),
            (68.8, ['E5'], 'piano', 0.4),
            (71.2, ['E5'], 'piano', 0.4),
            (77.0, ['A4', 'A5'], 'bell', 0.4),
        ],
        'swells': [(15.6, 1.6), (43.6, 1.6), (63.0, 1.6)],
        'booms': [(63.0, 'A1')],
    },
    6: {
        'seed': 606,
        'seconds': 82,
        'key': 'Bb',
        'motif_at': 0.7,
        'answer_at': 75.7,
        'chords': [
            (0.0, 4.8, 'Bbmaj9', 0.35, 0.9),
            (4.6, 10.2, 'Bbmaj7', 0.45, 0.8),    # the chirp
            (10.0, 15.4, 'Gm9', 0.45, 0.8),      # the pipeline
            (15.2, 20.6, 'Ebmaj9', 0.5, 0.8),    # each piece's slope
            (20.4, 25.8, 'Cm9', 0.45, 0.8),      # three number lines
            (25.6, 31.2, 'Bbmaj7', 0.5, 0.8),    # the nudge
            (31.0, 36.6, 'Gm9', 0.5, 0.8),
            (36.4, 39.6, 'Ebmaj7', 0.5, 0.8),    # shrink and zoom
            (39.4, 42.2, 'F9sus', 0.55, 0.85),   # 2, then cos 1
            (42.0, 47.8, 'Bbadd9', 0.6, 1.0),    # the chain rule
            (47.6, 53.2, 'Ebmaj9', 0.5, 0.85),
            (53.0, 58.6, 'Gm9', 0.5, 0.8),       # check on the graph
            (58.4, 64.2, 'Cm9', 0.5, 0.8),
            (64.0, 69.6, 'F9sus', 0.5, 0.85),    # the envelope
            (69.4, 75.6, 'Ebmaj9', 0.5, 0.85),   # the du's cancel
            (75.4, 82.0, 'Bbmaj9', 0.4, 1.0),
        ],
        'arp': [(5.2, 20.4, 0.28), (21.0, 42.0, 0.28), (47.6, 69.0, 0.27)],
        'accents': [
            (12.2, ['D5'], 'piano', 0.45),
            (13.4, ['F5'], 'piano', 0.45),
            (13.9, ['Bb5'], 'bell', 0.32),
            (15.6, ['D6'], 'bell', 0.3),
            (16.4, ['F6'], 'bell', 0.3),
            (22.4, ['Bb4'], 'piano', 0.42),
            (23.05, ['D5'], 'piano', 0.42),
            (23.7, ['F5'], 'piano', 0.42),
            (26.4, ['Bb5'], 'bell', 0.3),
            (27.8, ['D6'], 'bell', 0.3),
            (31.5, ['F6'], 'bell', 0.3),
            (39.5, ['C6'], 'bell', 0.34),
            (40.0, ['F6'], 'bell', 0.34),
            (42.4, ['Bb5', 'D6', 'F6'], 'bell', 0.42),
            (50.4, ['G4'], 'piano', 0.45),
            (51.8, ['Bb4'], 'piano', 0.45),
            (55.4, ['D6'], 'bell', 0.32),
            (71.6, ['F5'], 'piano', 0.45),
            (72.4, ['Bb5', 'D6'], 'bell', 0.38),
            (79.4, ['Bb4', 'Bb5'], 'bell', 0.4),
        ],
        'swells': [(42.4, 1.8), (65.0, 1.6)],
        'booms': [(42.4, 'Bb0')],
    },
    7: {
        'seed': 707,
        'seconds': 81,
        'key': 'C',
        'motif_at': 0.7,
        'answer_at': 74.9,
        'chords': [
            (0.0, 4.8, 'Cmaj9', 0.35, 0.9),
            (4.6, 10.2, 'Cmaj7', 0.45, 0.8),     # x² sin x
            (10.0, 15.8, 'Am9', 0.45, 0.8),      # the tempting guess
            (15.6, 20.8, 'Fmaj9', 0.5, 0.8),
            (20.6, 26.0, 'Cmaj9', 0.5, 0.85),    # the rectangle
            (25.8, 31.4, 'Em7', 0.45, 0.8),      # the nudge
            (31.2, 36.8, 'Fmaj7', 0.5, 0.8),     # the side strip
            (36.6, 42.0, 'Dm9', 0.5, 0.8),       # the top strip and the corner
            (41.8, 47.4, 'G9sus', 0.5, 0.85),    # the corner vanishes
            (47.2, 52.8, 'Cadd9', 0.6, 1.0),     # the product rule
            (52.6, 58.2, 'Fmaj9', 0.5, 0.85),
            (58.0, 63.6, 'Am9', 0.5, 0.8),       # check on the graph
            (63.4, 69.0, 'Dm9', 0.5, 0.8),
            (68.8, 74.8, 'Fmaj9', 0.55, 0.9),    # three slabs
            (74.6, 81.0, 'Cmaj9', 0.4, 1.0),
        ],
        'arp': [(5.2, 20.4, 0.28), (21.0, 47.0, 0.28), (52.6, 74.0, 0.27)],
        'accents': [
            (8.0, ['E5'], 'piano', 0.42),
            (12.5, ['G4'], 'piano', 0.42),
            (14.3, ['C6'], 'bell', 0.32),
            (14.9, ['F4'], 'piano', 0.4),
            (21.9, ['C5'], 'piano', 0.42),
            (22.8, ['E5'], 'piano', 0.42),
            (24.0, ['G5'], 'bell', 0.32),
            (27.3, ['E6'], 'bell', 0.3),
            (28.6, ['G6'], 'bell', 0.3),
            (33.6, ['C5'], 'piano', 0.45),
            (36.9, ['E5'], 'piano', 0.45),
            (39.0, ['G6'], 'bell', 0.24),
            (43.3, ['D6'], 'bell', 0.3),
            (46.4, ['C6'], 'bell', 0.3),
            (47.6, ['C5', 'E5', 'G5'], 'bell', 0.4),
            (54.2, ['G4'], 'piano', 0.45),
            (55.2, ['C5'], 'piano', 0.45),
            (60.9, ['E6'], 'bell', 0.32),
            (67.5, ['F4'], 'piano', 0.4),
            (70.1, ['C6'], 'bell', 0.3),
            (70.5, ['E6'], 'bell', 0.3),
            (70.9, ['G6'], 'bell', 0.3),
            (78.5, ['C4', 'C5'], 'bell', 0.4),   # last word of the series
        ],
        'swells': [(47.6, 1.8)],
        'booms': [(47.6, 'C1')],
    },
}

if __name__ == '__main__':
    only = [int(a) for a in sys.argv[1:]]
    for n, spec in CHAPTERS.items():
        if only and n not in only:
            continue
        wav = os.path.join(ROOT, 'out', f'calculus-0{n}-score.wav')
        mp3 = os.path.join(ROOT, 'projects', 'calculus-visually', 'assets', f'ch0{n}-score.mp3')
        s.write_wav(wav, score(spec))
        # quieter than Afterglow: this sits under captions people are reading
        s.encode_mp3(wav, mp3, lufs=-19)
        print('wrote', os.path.relpath(mp3, ROOT))
