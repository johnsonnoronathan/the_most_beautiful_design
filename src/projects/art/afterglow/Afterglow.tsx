import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {asset} from '../../../lib/assets';
import {loadStudioFonts, MONO, SANS, SERIF} from '../../../lib/fonts';
import {buildGeometry, elevation} from './engine';
import {Valley} from './Valley';

loadStudioFonts();

export type AfterglowProps = {
  /** 'preview' lightens the cloud and water filters for real-time playback in a browser. */
  quality: 'preview' | 'final';
};

const INK = '#FFF4E6';
const BAR = 138;

// Hour of day across the film: lingers at dawn and dusk, hurries through noon.
const HOUR_FRAMES = [0, 210, 360, 500, 620, 740, 800, 900, 1130, 1280, 1440];
const HOUR_VALUES = [3.9, 5.4, 6.3, 8.5, 11.6, 13.6, 16.2, 17.4, 19.3, 20.8, 22.0];

const CAPTIONS = [
  {from: 40, to: 205, name: 'Before dawn', line: 'Stars, and the valley asleep.'},
  {from: 222, to: 348, name: 'First light', line: 'The sky pales before anything else does.'},
  {from: 362, to: 492, name: 'Sunrise', line: 'Light finds the far ridges first.'},
  {from: 506, to: 612, name: 'Morning', line: 'Mist lifts out of the low places.'},
  {from: 626, to: 736, name: 'Noon', line: 'Short shadows under the bluest sky.'},
  {from: 790, to: 905, name: 'Golden hour', line: 'Low sun, long light, soft edges.'},
  {from: 918, to: 1004, name: 'Sunset', line: 'The sun meets the ridgeline.'},
  {from: 1286, to: 1398, name: 'Blue hour', line: 'Cold light, and the first stars.'},
];

const TITLE_FROM = 1014;
const TITLE_TO = 1268;

const fade = (frame: number, from: number, to: number, len = 20) =>
  interpolate(frame, [from, from + len, to - len, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const clock = (h: number) => {
  const hh = Math.floor(h) % 24;
  const mm = Math.floor((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

const Caption: React.FC<{frame: number; c: (typeof CAPTIONS)[number]}> = ({frame, c}) => {
  const o = fade(frame, c.from, c.to, 22);
  if (o <= 0) return null;
  const rise = interpolate(frame, [c.from, c.from + 40], [18, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const blur = interpolate(o, [0, 1], [10, 0]);
  return (
    <div style={{position: 'absolute', left: 140, bottom: BAR + 64, opacity: o, transform: `translateY(${rise}px)`, filter: `blur(${blur}px)`, color: INK}}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 116, lineHeight: 1, letterSpacing: '-0.03em', textShadow: '0 2px 40px rgba(0,0,0,0.35)'}}>{c.name}</div>
      <div style={{marginTop: 14, fontFamily: SANS, fontWeight: 300, fontSize: 27, letterSpacing: '0.005em', opacity: 0.92, textShadow: '0 1px 18px rgba(0,0,0,0.4)'}}>{c.line}</div>
    </div>
  );
};

const Title: React.FC<{frame: number}> = ({frame}) => {
  const out = interpolate(frame, [TITLE_TO - 30, TITLE_TO], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (frame < TITLE_FROM || frame > TITLE_TO) return null;
  const word = 'Afterglow';
  const kicker = fade(frame, TITLE_FROM, TITLE_TO, 24);
  const quote = interpolate(frame, [TITLE_FROM + 70, TITLE_FROM + 110], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', color: INK, opacity: out}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateY(-60px)'}}>
        <div style={{fontFamily: MONO, fontSize: 15, letterSpacing: '0.42em', textTransform: 'uppercase', opacity: kicker * 0.85, marginBottom: 18}}>Study No. 02</div>
        <div style={{display: 'flex', fontFamily: SERIF, fontStyle: 'italic', fontSize: 236, lineHeight: 1.05, letterSpacing: '-0.035em', textShadow: '0 4px 60px rgba(20,8,30,0.45)'}}>
          {word.split('').map((ch, i) => {
            const t = interpolate(frame, [TITLE_FROM + 6 + i * 5, TITLE_FROM + 36 + i * 5], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            });
            return (
              <span key={i} style={{display: 'inline-block', opacity: t, transform: `translateY(${(1 - t) * 40}px)`, filter: `blur(${(1 - t) * 14}px)`}}>
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{marginTop: 64, fontFamily: SANS, fontWeight: 300, fontSize: 32, letterSpacing: '0.01em', opacity: quote, textShadow: '0 1px 24px rgba(0,0,0,0.4)'}}>
          The sky keeps burning after the fire is out.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Afterglow: React.FC<AfterglowProps> = ({quality}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const geo = useMemo(() => buildGeometry(7, 2100, 1080, 500, 690, 705), []);

  const hour = interpolate(frame, HOUR_FRAMES, HOUR_VALUES, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const progress = frame / durationInFrames;
  const zoom = interpolate(progress, [0, 1], [1.0, 1.09], {easing: Easing.inOut(Easing.sin)});
  const pan = interpolate(progress, [0, 1], [40, -40], {easing: Easing.inOut(Easing.sin)});

  const bar = interpolate(
    frame,
    [0, 54, durationInFrames - 46, durationInFrames - 1],
    [540, BAR, BAR, 540],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)},
  );
  const hud = fade(frame, 40, durationInFrames - 40, 30);
  const deg = Math.round(elevation(hour) * 62);

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Audio src={asset('art/afterglow/score.mp3')} />
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 56%'}}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{display: 'block'}}>
          <Valley frame={frame} hour={hour} pan={pan} geo={geo} lite={quality === 'preview'} />
        </svg>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          backgroundImage: `url(${asset('art/afterglow/grain.png')})`,
          backgroundSize: '256px 256px',
          backgroundPosition: `${(frame * 37) % 256}px ${(frame * 91) % 256}px`,
          mixBlendMode: 'overlay',
          opacity: 0.085,
        }}
      />

      {CAPTIONS.map((c) => (
        <Caption key={c.name + c.from} frame={frame} c={c} />
      ))}
      <Title frame={frame} />

      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: bar, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: bar, background: '#000'}} />

      <div style={{position: 'absolute', left: 140, right: 140, top: 0, height: BAR, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: hud, fontFamily: MONO, fontSize: 14, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#9D978F'}}>
        <span>Afterglow — Study No. 02</span>
        <span>One valley · eighteen ridgelines · one day</span>
      </div>
      <div style={{position: 'absolute', left: 140, right: 140, bottom: 0, height: BAR, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: hud, fontFamily: MONO, fontSize: 14, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#9D978F'}}>
        <span>{deg >= 0 ? `Sun ${deg}° above the ridge` : `Sun ${Math.abs(deg)}° below the ridge`}</span>
        <span style={{fontFamily: SANS, fontWeight: 200, fontSize: 44, letterSpacing: '0.02em', color: '#E9E2D8', fontVariantNumeric: 'tabular-nums'}}>{clock(hour)}</span>
        <span>Seed 007</span>
      </div>
    </AbsoluteFill>
  );
};
