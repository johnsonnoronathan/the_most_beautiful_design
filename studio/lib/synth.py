"""Small numpy synthesizer shared by the studio's scores.

Voices: soft pads, a felt piano, FM bells. Plus a synthetic hall reverb,
equal-power panning, a gentle master stage and a WAV writer. Everything is
deterministic for a given seed.
"""

import os
import subprocess
import wave

import numpy as np

SR = 48000
_rng = np.random.default_rng(1)


def reseed(seed):
    global _rng
    _rng = np.random.default_rng(seed)


def rand():
    return _rng.random()


NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def hz(note):
    """'D3' / 'F#4' / 'Bb2' → frequency in Hz."""
    name, octave = note[:-1], int(note[-1])
    midi = 12 * (octave + 1) + NOTE[name]
    return 440.0 * 2 ** ((midi - 69) / 12)


def buffer(seconds):
    return np.zeros((2, int(SR * seconds)))


def pan(mono, p):
    """Equal-power pan, p in [-1, 1]."""
    a = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)])


def add(buf, start_s, stereo):
    i = int(start_s * SR)
    if i >= buf.shape[1] or i + stereo.shape[1] <= 0:
        return
    j = min(buf.shape[1], i + stereo.shape[1])
    buf[:, i:j] += stereo[:, : j - i]


def envelope(n, attack, release, hold):
    t = np.arange(n) / SR
    e = np.clip(t / attack, 0, 1)
    e = e * e * (3 - 2 * e)
    r = np.clip(1 - (t - hold) / release, 0, 1)
    return e * np.where(t < hold, 1.0, r * r)


def pad_note(freq, length, brightness=0.5, attack=2.0, release=2.6):
    n = int((length + release) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for detune in (-6, 0, 6):
        f = freq * 2 ** (detune / 1200)
        vib = 1 + 0.0015 * np.sin(2 * np.pi * (0.16 + rand() * 0.1) * t + rand() * 6)
        phase = 2 * np.pi * np.cumsum(np.full(n, f) * vib) / SR
        for k in range(1, 9):
            if f * k > 9000:
                break
            amp = (1 / k ** 1.5) * np.exp(-(k - 1) * (1.15 - brightness))
            out += amp * np.sin(k * phase + rand() * 6.283)
    out *= 0.88 + 0.12 * np.sin(2 * np.pi * 0.09 * t + rand() * 6)
    return out * envelope(n, attack, release, length) / 3


def piano_note(freq, vel=1.0, length=3.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    B = 0.00035
    for k in range(1, 11):
        fk = k * freq * np.sqrt(1 + B * k * k)
        if fk > 12000:
            break
        amp = (1 / k ** 1.35) * np.exp(-t * (1.1 + 0.55 * k)) * (vel ** (0.4 + 0.12 * k))
        out += amp * np.sin(2 * np.pi * fk * t + rand() * 0.3)
    attack = np.clip(t / 0.006, 0, 1)
    tail = np.clip((length - t) / 0.4, 0, 1)
    thump = np.exp(-t * 60) * np.sin(2 * np.pi * freq * 0.5 * t) * 0.15
    return (out + thump) * attack * tail * vel * 0.5


def bell(freq, vel=1.0, length=5.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    index = 2.0 * np.exp(-t * 2.5)
    s = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * 3.5 * t))
    s += 0.35 * np.sin(2 * np.pi * freq * 2.756 * t) * np.exp(-t * 2.2)
    s += 0.18 * np.sin(2 * np.pi * freq * 5.404 * t) * np.exp(-t * 3.5)
    amp = np.exp(-t * 0.95) * np.clip(t / 0.003, 0, 1)
    return s * amp * vel * 0.32


def shaped_noise(n, curve):
    spec = np.fft.rfft(_rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    out = np.fft.irfft(spec * curve(f), n)
    return out / (np.abs(out).max() + 1e-9)


def swell(length, centre_from=300, centre_to=5000):
    """Filtered-noise swell whose band climbs over `length` seconds."""
    n = int(length * SR)
    frame = 4096
    hop = frame // 4
    win = np.hanning(frame)
    noise = _rng.standard_normal(n + frame)
    out = np.zeros(n + frame)
    freqs = np.fft.rfftfreq(frame, 1 / SR)
    for i in range(0, n, hop):
        p = i / n
        centre = centre_from * (centre_to / centre_from) ** (p ** 1.6)
        band = np.exp(-0.5 * (np.log(freqs + 1) - np.log(centre)) ** 2 / 0.35)
        seg = np.fft.irfft(np.fft.rfft(noise[i:i + frame] * win) * band, frame)
        out[i:i + frame] += seg * win * (p ** 2.2)
    out = out[:n]
    return out / (np.abs(out).max() + 1e-9)


def reverb_ir(seconds=4.0, decay=1.05):
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
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:, : x.shape[1]]


def master(mix, fade_in=1.2, fade_out=2.4):
    dur = mix.shape[1] / SR
    tt = np.arange(mix.shape[1]) / SR
    mix = mix * np.interp(tt, [0, fade_in, dur - fade_out, dur], [0, 1, 1, 0])
    mix /= np.abs(mix).max() + 1e-9
    mix = np.where(np.abs(mix) > 0.7, np.sign(mix) * (0.7 + 0.3 * np.tanh((np.abs(mix) - 0.7) / 0.3)), mix)
    return mix * 10 ** (-1.0 / 20) / (np.abs(mix).max() + 1e-9)


def write_wav(path, stereo):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = (np.clip(stereo.T, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def encode_mp3(wav_path, mp3_path, lufs=-16):
    """Loudness-normalise and encode with ffmpeg."""
    os.makedirs(os.path.dirname(mp3_path), exist_ok=True)
    subprocess.run(
        ['ffmpeg', '-v', 'error', '-y', '-i', wav_path, '-af', f'loudnorm=I={lufs}:TP=-2:LRA=11', '-ar', '48000', '-c:a', 'libmp3lame', '-b:a', '160k', mp3_path],
        check=True,
    )
