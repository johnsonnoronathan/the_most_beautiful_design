"""Afterglow — original score, synthesized from scratch with numpy.

Written to the film's timeline (30 fps, 48 s). Chords change with the light,
a felt-piano arpeggio carries the day, high bells are the stars, and the
"Afterglow" title is answered by a nine-note cascade, one note per letter.

    python3 music/compose.py            # writes out/afterglow-score.wav
    ffmpeg -i out/afterglow-score.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 \
        -ar 48000 -c:a libmp3lame -b:a 192k public/afterglow-score.mp3
"""

import os
import wave

import numpy as np

SR = 48000
DUR = 48.0
N = int(SR * DUR)
FPS = 30
rng = np.random.default_rng(7)


def hz(note):
    """'D3' / 'F#4' → frequency."""
    names = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
    name, octave = note[:-1], int(note[-1])
    midi = 12 * (octave + 1) + names[name]
    return 440.0 * 2 ** ((midi - 69) / 12)


def pan_stereo(mono, pan):
    """Equal-power pan, pan in [-1, 1]."""
    a = (pan + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)])


def add(buf, start_s, stereo):
    i = int(start_s * SR)
    if i >= buf.shape[1]:
        return
    j = min(buf.shape[1], i + stereo.shape[1])
    buf[:, i:j] += stereo[:, : j - i]


def env_adsr(n, attack, release, sustain_len):
    t = np.arange(n) / SR
    e = np.clip(t / attack, 0, 1)
    e = e * e * (3 - 2 * e)
    rel_start = sustain_len
    r = np.clip(1 - (t - rel_start) / release, 0, 1)
    return e * np.where(t < rel_start, 1.0, r * r)


# ---------------------------------------------------------------- voices

def pad_note(freq, length, brightness=0.5, attack=2.2, release=3.0):
    n = int((length + release) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for detune in (-7, 0, 7):
        f = freq * 2 ** (detune / 1200)
        vib = 1 + 0.0018 * np.sin(2 * np.pi * (0.17 + rng.random() * 0.1) * t + rng.random() * 6)
        phase = 2 * np.pi * np.cumsum(np.full(n, f) * vib) / SR
        for k in range(1, 9):
            if f * k > 9000:
                break
            amp = (1 / k ** 1.5) * np.exp(-(k - 1) * (1.15 - brightness))
            out += amp * np.sin(k * phase + rng.random() * 6.283)
    # slow breathing swell
    out *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.09 * t + rng.random() * 6)
    return out * env_adsr(n, attack, release, length) / 3


def piano_note(freq, vel=1.0, length=3.2):
    n = int(length * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    B = 0.00035
    for k in range(1, 11):
        fk = k * freq * np.sqrt(1 + B * k * k)
        if fk > 12000:
            break
        amp = (1 / k ** 1.35) * np.exp(-t * (1.1 + 0.55 * k)) * (vel ** (0.4 + 0.12 * k))
        out += amp * np.sin(2 * np.pi * fk * t + rng.random() * 0.3)
    attack = np.clip(t / 0.006, 0, 1)
    tail = np.clip((length - t) / 0.4, 0, 1)
    # felt: soften the transient with a short low-passed thump
    thump = np.exp(-t * 60) * np.sin(2 * np.pi * freq * 0.5 * t) * 0.15
    return (out + thump) * attack * tail * vel * 0.5


def bell(freq, vel=1.0, length=6.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    index = 2.2 * np.exp(-t * 2.5)
    s = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * 3.5 * t))
    s += 0.35 * np.sin(2 * np.pi * freq * 2.756 * t) * np.exp(-t * 2.2)
    s += 0.18 * np.sin(2 * np.pi * freq * 5.404 * t) * np.exp(-t * 3.5)
    amp = np.exp(-t * 0.9) * np.clip(t / 0.003, 0, 1)
    return s * amp * vel * 0.32


def shaped_noise(n, curve):
    """White noise shaped in the frequency domain by curve(freqs)."""
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    out = np.fft.irfft(spec * curve(f), n)
    return out / (np.abs(out).max() + 1e-9)


def riser(length):
    """Filtered-noise swell whose band climbs, ending at the title hit."""
    n = int(length * SR)
    frame = 4096
    hop = frame // 4
    win = np.hanning(frame)
    noise = rng.standard_normal(n + frame)
    out = np.zeros(n + frame)
    freqs = np.fft.rfftfreq(frame, 1 / SR)
    for i in range(0, n, hop):
        p = i / n
        centre = 300 * (6000 / 300) ** (p ** 1.6)
        band = np.exp(-0.5 * (np.log(freqs + 1) - np.log(centre)) ** 2 / 0.35)
        seg = np.fft.irfft(np.fft.rfft(noise[i:i + frame] * win) * band, frame)
        out[i:i + frame] += seg * win * (p ** 2.2)
    out = out[:n]
    return out / (np.abs(out).max() + 1e-9)


def reverb_ir(seconds=4.5, decay=1.15):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    chans = []
    for _ in range(2):
        low = shaped_noise(n, lambda f: 1 / (1 + (f / 1800) ** 2))
        high = shaped_noise(n, lambda f: (f / 1800) ** 2 / (1 + (f / 1800) ** 2))
        ir = low * np.exp(-t / decay) + 0.6 * high * np.exp(-t / (decay * 0.45))
        ir *= np.clip(t / 0.012, 0, 1)
        chans.append(ir)
    ir = np.stack(chans)
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


def convolve(x, ir):
    n = x.shape[1] + ir.shape[1] - 1
    size = 1 << (n - 1).bit_length()
    out = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:, : x.shape[1]]
    return out


# ---------------------------------------------------------------- score

def sec(frame):
    return frame / FPS


# Chords follow the light. (start s, end s, notes, brightness, level)
CHORDS = [
    (0.0, 7.4, ['D2', 'A2', 'E3', 'A3'], 0.15, 0.9),            # before dawn: open fifths, dark
    (7.0, 12.2, ['D3', 'F#3', 'A3', 'C#4', 'E4'], 0.35, 0.9),     # first light: Dmaj9
    (12.0, 16.9, ['G2', 'D3', 'F#3', 'B3', 'C#4'], 0.55, 0.95),   # sunrise: Gmaj7#11, lydian lift
    (16.7, 20.9, ['D3', 'A3', 'E4', 'F#4'], 0.6, 0.7),            # morning
    (20.7, 24.9, ['A2', 'E3', 'F#3', 'B3', 'C#4'], 0.65, 0.7),    # noon: A6/9
    (24.7, 30.2, ['B2', 'F#3', 'A3', 'C#4', 'D4'], 0.45, 0.85),   # golden hour: Bm9
    (30.0, 34.0, ['G2', 'D3', 'F#3', 'A3', 'B3'], 0.4, 0.9),      # sunset: Gmaj9
    (33.8, 38.8, ['D2', 'A2', 'F#3', 'C#4', 'E4', 'A4'], 0.55, 1.15),  # afterglow: full Dmaj9
    (38.6, 43.0, ['G2', 'B2', 'F#3', 'A3', 'D4', 'E4'], 0.4, 1.0),     # Gmaj9/B, settling
    (42.8, 48.0, ['D2', 'A2', 'E3', 'A3'], 0.15, 0.8),            # blue hour: back to the start
]

# Arpeggio through the day: (start, end, chord tones, level)
ARP = [
    (16.9, 20.8, ['D4', 'F#4', 'A4', 'E5', 'C#5', 'A4'], 0.55),
    (20.8, 24.8, ['A3', 'E4', 'F#4', 'B4', 'C#5', 'B4'], 0.6),
    (24.8, 30.1, ['B3', 'F#4', 'A4', 'D5', 'C#5', 'A4'], 0.5),
    (30.1, 33.6, ['G3', 'D4', 'F#4', 'B4', 'A4', 'F#4'], 0.4),
]
EIGHTH = 60 / 72 / 2  # 72 bpm

PENTA = ['D', 'E', 'F#', 'A', 'B']


def compose():
    pads = np.zeros((2, N))
    keys = np.zeros((2, N))
    bells = np.zeros((2, N))
    fx = np.zeros((2, N))

    for start, end, notes, bright, level in CHORDS:
        for i, note in enumerate(notes):
            mono = pad_note(hz(note), end - start, brightness=bright) * level * (0.9 if i else 1.0)
            add(pads, start, pan_stereo(mono, (i / max(1, len(notes) - 1) - 0.5) * 0.7))

    for start, end, tones, level in ARP:
        t = start
        step = 0
        while t < end:
            vel = level * (0.75 + 0.25 * np.sin(step * 0.9)) * (1.1 if step % 6 == 0 else 1.0)
            note = tones[step % len(tones)]
            swing = 0.012 * rng.standard_normal()
            add(keys, t + swing, pan_stereo(piano_note(hz(note), vel), (rng.random() - 0.5) * 0.5))
            t += EIGHTH
            step += 1

    # stars: sparse pentatonic bells at night
    def star_field(t0, t1, density):
        t = t0
        while t < t1:
            note = PENTA[rng.integers(len(PENTA))] + str(rng.choice([5, 5, 6]))
            add(bells, t, pan_stereo(bell(hz(note), 0.35 + rng.random() * 0.4), rng.random() * 1.6 - 0.8))
            t += density * (0.6 + rng.random() * 0.9)

    star_field(0.8, 9.0, 0.95)
    star_field(41.0, 46.5, 0.85)

    # shooting stars: a quick descending glissando of bells
    for f in (70, 1318, 1372):
        for i, note in enumerate(['A6', 'F#6', 'E6', 'D6', 'B5', 'A5']):
            add(bells, sec(f) + i * 0.055, pan_stereo(bell(hz(note), 0.35 - i * 0.03, 4.0), 0.6 - i * 0.2))

    # the title: a riser into a soft low swell, then one bell per letter
    title = sec(1014)
    rise = riser(2.4) * 0.22
    add(fx, title - 2.4 + 0.2, pan_stereo(rise, 0))
    n = int(6 * SR)
    t = np.arange(n) / SR
    boom = (np.sin(2 * np.pi * hz('D1') * t) + 0.5 * np.sin(2 * np.pi * hz('D2') * t)) * np.exp(-t * 0.8) * np.clip(t / 0.08, 0, 1)
    add(fx, title + 0.2, pan_stereo(boom * 0.45, 0))
    cascade = ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6', 'F#6', 'A6']
    for i, note in enumerate(cascade):
        letter = sec(1014 + 6 + i * 5 + 8)
        add(bells, letter, pan_stereo(bell(hz(note), 0.55, 5.0), -0.6 + i * 0.15))

    # air: wind over water, louder at night
    air = np.stack([
        shaped_noise(N, lambda f: np.exp(-0.5 * ((np.log(f + 1) - np.log(500)) / 0.9) ** 2)),
        shaped_noise(N, lambda f: np.exp(-0.5 * ((np.log(f + 1) - np.log(520)) / 0.9) ** 2)),
    ])
    tt = np.arange(N) / SR
    night = np.interp(tt, [0, 9, 14, 40, 44, 48], [1, 0.7, 0.25, 0.3, 0.9, 1])
    gust = 0.7 + 0.3 * np.sin(2 * np.pi * 0.07 * tt) * np.sin(2 * np.pi * 0.031 * tt + 1)
    air *= 0.045 * night * gust

    ir = reverb_ir()
    mix = (
        pads * 0.55 + convolve(pads, ir) * 0.45
        + keys * 0.6 + convolve(keys, ir) * 0.55
        + bells * 0.35 + convolve(bells, ir) * 0.7
        + fx * 0.7 + convolve(fx, ir) * 0.5
        + air
    )

    fade = np.interp(tt, [0, 1.6, DUR - 2.4, DUR], [0, 1, 1, 0])
    mix *= fade
    # gentle soft-knee limiting on peaks only, then -1 dBFS ceiling
    mix /= np.abs(mix).max() + 1e-9
    mix = np.where(np.abs(mix) > 0.7, np.sign(mix) * (0.7 + 0.3 * np.tanh((np.abs(mix) - 0.7) / 0.3)), mix)
    mix *= 10 ** (-1.0 / 20) / (np.abs(mix).max() + 1e-9)
    return mix


def write_wav(path, stereo):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = (np.clip(stereo.T, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


if __name__ == '__main__':
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(root, 'out', 'afterglow-score.wav')
    write_wav(out, compose())
    print('wrote', out)
