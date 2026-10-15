"""Voiceover for Calculus, visually.

Reads chNN.json (caption text + spoken wording per line), synthesizes each line
with the offline Kokoro voice, trims silence, and places it at its caption's
start. A line that would run into the next one is sped up (at most 15 %); if it
still does not fit, it is reported so the wording can be tightened.

Writes projects/calculus-visually/assets/chNN-voice.mp3 and chNN.timing.json (speech
intervals, used to duck the music under the voice).

    scripts/setup-tts.sh                                   # once
    .cache/tts/venv/bin/python projects/calculus-visually/voice/narrate.py [1 2 3 4 5 6]
"""

import glob
import json
import os
import subprocess
import sys
import wave

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(ROOT, '.cache', 'tts')
SECONDS = {1: 68, 2: 64, 3: 70, 4: 77, 5: 80, 6: 82}
CAPTION_LEAD = 0.2   # speech starts just after its caption begins to fade in
GAP = 0.15           # minimum silence before the next line
MAX_SPEED = 1.15


def load_voice():
    import espeakng_loader
    from kokoro_onnx import EspeakConfig, Kokoro

    npz = os.path.join(CACHE, 'voices.npz')
    if not os.path.exists(npz):
        voices = {os.path.basename(p)[:-4]: np.fromfile(p, dtype=np.float32).reshape(-1, 1, 256) for p in glob.glob(os.path.join(CACHE, 'voices', '*.bin'))}
        np.savez(npz, **voices)
    espeak = EspeakConfig(lib_path=espeakng_loader.get_library_path(), data_path=os.path.join(ROOT, '.cache', 'espeak-ng-data'))
    return Kokoro(os.path.join(CACHE, 'kokoro-quantized.onnx'), npz, espeak_config=espeak)


def synth(tts, text, voice, speed):
    """One line of speech at 24 kHz. Calls the model directly: this export takes a float speed."""
    phonemes = tts.tokenizer.phonemize(text, 'en-us')
    tokens = np.array(tts.tokenizer.tokenize(phonemes), dtype=np.int64)
    style = np.asarray(tts.get_voice_style(voice)[len(tokens)], dtype=np.float32)
    feed = {'input_ids': [[0, *tokens, 0]], 'style': style, 'speed': np.array([speed], dtype=np.float32)}
    return tts.sess.run(None, feed)[0].squeeze().astype(np.float32), 24000


def trim(audio, sr, threshold=0.008, pad=0.03):
    idx = np.flatnonzero(np.abs(audio) > threshold)
    if idx.size == 0:
        return audio
    a = max(0, idx[0] - int(pad * sr))
    z = min(len(audio), idx[-1] + int(pad * sr))
    return audio[a:z]


def narrate(chapter, tts):
    spec = json.load(open(os.path.join(HERE, f'ch0{chapter}.json')))
    lines = spec['lines']
    total = SECONDS[chapter]
    sr = 24000
    track = np.zeros(int(total * sr), dtype=np.float32)
    timing = []
    report = []

    for i, line in enumerate(lines):
        start = line['from'] + (CAPTION_LEAD if 'text' in line else 0.0)
        nxt = lines[i + 1]['from'] + (CAPTION_LEAD if 'text' in lines[i + 1] else 0.0) if i + 1 < len(lines) else total - 0.4
        slot = min(nxt, total - 0.4) - GAP - start

        speed = 1.0
        audio, sr = synth(tts, line['say'], spec['voice'], speed)
        audio = trim(audio, sr)
        dur = len(audio) / sr
        if dur > slot:
            speed = min(MAX_SPEED, dur / slot * 1.02)
            audio, sr = synth(tts, line['say'], spec['voice'], speed)
            audio = trim(audio, sr)
            dur = len(audio) / sr

        i0 = int(start * sr)
        i1 = min(len(track), i0 + len(audio))
        track[i0:i1] += audio[: i1 - i0]
        timing.append({'start': round(start, 2), 'end': round(start + dur, 2)})
        flag = 'OVERRUN' if dur > slot + 1e-3 else 'ok'
        report.append(f'  {flag:7s} {start:5.1f}s  {dur:4.1f}s of {slot:4.1f}s  x{speed:.2f}  {line["say"][:60]}')

    wav = os.path.join(ROOT, 'out', f'calculus-0{chapter}-voice.wav')
    os.makedirs(os.path.dirname(wav), exist_ok=True)
    pcm = (np.clip(track, -1, 1) * 32767).astype('<i2')
    with wave.open(wav, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())

    mp3 = os.path.join(ROOT, 'projects', 'calculus-visually', 'assets', f'ch0{chapter}-voice.mp3')
    subprocess.run(
        ['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', 'highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11', '-ac', '2', '-ar', '48000', '-c:a', 'libmp3lame', '-b:a', '128k', mp3],
        check=True,
    )
    with open(os.path.join(HERE, f'ch0{chapter}.timing.json'), 'w') as f:
        json.dump(timing, f, indent=1)
        f.write('\n')
    print(f'chapter {chapter} → {os.path.relpath(mp3, ROOT)}')
    print('\n'.join(report))


if __name__ == '__main__':
    tts = load_voice()
    for ch in [int(a) for a in sys.argv[1:]] or [1, 2, 3, 4, 5, 6]:
        narrate(ch, tts)
