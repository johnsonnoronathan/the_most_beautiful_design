import katex from 'katex';
import 'katex/dist/katex.min.css';
import React, {useId, useMemo} from 'react';
import {AbsoluteFill, Audio, Easing, useCurrentFrame} from 'remotion';
import {loadMathFonts, loadStudioFonts, MONO, SANS, SERIF} from '../../studio/lib/fonts';

loadStudioFonts();
loadMathFonts();

export const FPS = 30;
export const SERIES = 'Calculus, visually';
export const CHAPTERS = 4;

// Ink on a near-black board. Each mathematical object keeps one colour all series long:
// the function is amber, slopes/derivatives are teal, accumulated area is coral.
export const C = {
  bg: '#0E1014',
  ink: '#ECE7DF',
  bright: '#FFFFFF',
  muted: '#8E939C',
  faint: '#262A33',
  grid: '#1A1D24',
  axis: '#5A606B',
  f: '#F4B860',
  d: '#5CC8C2',
  a: '#F07B6A',
};

export const MATH = {f: C.f, d: C.d, a: C.a, w: C.bright};

// ------------------------------------------------------------------ time

export const useT = () => useCurrentFrame() / FPS;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0→1 between seconds a and b, eased. */
export const ramp = (t: number, a: number, b: number, ease: (x: number) => number = Easing.inOut(Easing.cubic)) =>
  ease(clamp01((t - a) / (b - a)));

/** Visible from a to b with soft edges. */
export const span = (t: number, a: number, b: number, fadeIn = 0.45, fadeOut = 0.45) =>
  Math.min(ramp(t, a, a + fadeIn, Easing.out(Easing.quad)), 1 - ramp(t, b - fadeOut, b, Easing.in(Easing.quad)));

export const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (n: number, s: number) => (n >> s) & 255;
  const m = (s: number) => Math.round(lerp(ch(pa, s), ch(pb, s), clamp01(t)));
  return `rgb(${m(16)}, ${m(8)}, ${m(0)})`;
};

export const fmt = (v: number, d = 3) => v.toFixed(d);

/** Unique, url()-safe id prefix so several players and thumbnails can share a page. */
export const useUid = () => 'u' + useId().replace(/[^a-zA-Z0-9]/g, '');

// ------------------------------------------------------------------ math text

export const Tex: React.FC<{tex: string; size?: number; color?: string; inline?: boolean; style?: React.CSSProperties}> = ({tex, size = 44, color = C.ink, inline = false, style}) => {
  const html = useMemo(
    () => katex.renderToString(inline ? tex : `\\displaystyle ${tex}`, {throwOnError: false, output: 'html', strict: 'ignore'}),
    [tex, inline],
  );
  return <span style={{fontSize: size, color, lineHeight: 1.25, whiteSpace: 'nowrap', ...style}} dangerouslySetInnerHTML={{__html: html}} />;
};

/** Text with inline $math$ and [[f|coloured]] runs (f amber, d teal, a coral, w white). */
export const Rich: React.FC<{text: string; size: number}> = ({text, size}) => {
  const parts = text.split(/(\[\[[fdaw]\|.+?\]\]|\$[^$]+\$)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('$')) return <Tex key={i} tex={p.slice(1, -1)} size={size * 1.04} color="inherit" inline />;
        if (p.startsWith('[[')) {
          const key = p[2] as keyof typeof MATH;
          return (
            <span key={i} style={{color: MATH[key]}}>
              <Rich text={p.slice(4, -2)} size={size} />
            </span>
          );
        }
        return <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </>
  );
};

// ------------------------------------------------------------------ layout

/** Absolutely positioned at (x, y); ax/ay pick the anchor (0 left/top, 0.5 centre, 1 right/bottom). */
export const Place: React.FC<{x: number; y: number; ax?: number; ay?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
  x,
  y,
  ax = 0,
  ay = 0.5,
  style,
  children,
}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(${-ax * 100}%, ${-ay * 100}%)`, ...style}}>{children}</div>
);

/** Wipes its content in from the left at `at`, fades out before `until`. */
export const Reveal: React.FC<{t: number; at: number; until?: number; dur?: number; children: React.ReactNode}> = ({t, at, until, dur = 0.8, children}) => {
  const p = ramp(t, at, at + dur, Easing.out(Easing.cubic));
  const o = until === undefined ? 1 : 1 - ramp(t, until - 0.45, until, Easing.in(Easing.quad));
  if (p <= 0 || o <= 0) return null;
  return <div style={{clipPath: `inset(-60px ${(1 - p) * 100}% -60px -60px)`, opacity: Math.min(1, p * 2.5) * o}}>{children}</div>;
};

export const Mono: React.FC<{size?: number; color?: string; children: React.ReactNode; style?: React.CSSProperties}> = ({size = 16, color = C.muted, children, style}) => (
  <span style={{fontFamily: MONO, fontSize: size, letterSpacing: '0.18em', textTransform: 'uppercase', color, ...style}}>{children}</span>
);

export const Readout: React.FC<{label: React.ReactNode; value: string; color?: string; size?: number}> = ({label, value, color = C.ink, size = 40}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
    <Mono size={14}>{label}</Mono>
    <span style={{fontFamily: MONO, fontSize: size, color, fontVariantNumeric: 'tabular-nums'}}>{value}</span>
  </div>
);

// ------------------------------------------------------------------ plotting

export type Box = {left: number; top: number; width: number; height: number; x0: number; x1: number; y0: number; y1: number};

export const sx = (b: Box, x: number) => b.left + ((x - b.x0) / (b.x1 - b.x0)) * b.width;
export const sy = (b: Box, y: number) => b.top + b.height - ((y - b.y0) / (b.y1 - b.y0)) * b.height;

export const curvePath = (b: Box, f: (x: number) => number, a: number, z: number, n = 220) => {
  if (z <= a) return '';
  let d = '';
  for (let i = 0; i <= n; i++) {
    const x = a + ((z - a) * i) / n;
    d += `${i ? 'L' : 'M'}${sx(b, x).toFixed(2)},${sy(b, f(x)).toFixed(2)}`;
  }
  return d;
};

export const areaPath = (b: Box, f: (x: number) => number, a: number, z: number, n = 160) => {
  if (z <= a) return '';
  return `${curvePath(b, f, a, z, n)}L${sx(b, z).toFixed(2)},${sy(b, 0).toFixed(2)}L${sx(b, a).toFixed(2)},${sy(b, 0).toFixed(2)}Z`;
};

/** Straight line through (x, y) with slope m, between xa and xb, in screen space. */
export const slopeLine = (b: Box, x: number, y: number, m: number, xa: number, xb: number) => ({
  x1: sx(b, xa),
  y1: sy(b, y + m * (xa - x)),
  x2: sx(b, xb),
  y2: sy(b, y + m * (xb - x)),
});

type Tick = number | [number, number];

export const Axes: React.FC<{
  b: Box;
  p: number;
  xTicks: Tick[];
  yTicks: Tick[];
  xLabel?: string;
  yLabel?: string;
  tickFmt?: (v: number) => string;
}> = ({b, p, xTicks, yTicks, xLabel, yLabel, tickFmt = (v) => String(v)}) => {
  const x0 = sx(b, Math.max(b.x0, 0));
  const y0 = sy(b, Math.max(b.y0, 0));
  const tick = (t: Tick) => (Array.isArray(t) ? t : [t, 1]);
  return (
    <g opacity={Math.min(1, p * 1.5)}>
      {xTicks.map(tick).map(([v, o]) => (
        <line key={'gx' + v} x1={sx(b, v)} y1={b.top} x2={sx(b, v)} y2={y0} stroke={C.grid} strokeWidth="1.5" opacity={o * p} />
      ))}
      {yTicks.map(tick).map(([v, o]) => (
        <line key={'gy' + v} x1={x0} y1={sy(b, v)} x2={b.left + b.width} y2={sy(b, v)} stroke={C.grid} strokeWidth="1.5" opacity={o * p} />
      ))}
      <line x1={x0} y1={y0} x2={x0 + (b.left + b.width + 24 - x0) * p} y2={y0} stroke={C.axis} strokeWidth="2.5" strokeLinecap="round" />
      <line x1={x0} y1={y0} x2={x0} y2={y0 - (y0 - b.top + 24) * p} stroke={C.axis} strokeWidth="2.5" strokeLinecap="round" />
      {xTicks.map(tick).map(([v, o]) => (
        <g key={'tx' + v} opacity={o * p}>
          <line x1={sx(b, v)} y1={y0} x2={sx(b, v)} y2={y0 + 10} stroke={C.axis} strokeWidth="2" />
          <text x={sx(b, v)} y={y0 + 38} textAnchor="middle" fill={C.muted} style={{fontFamily: MONO, fontSize: 20}}>
            {tickFmt(v)}
          </text>
        </g>
      ))}
      {yTicks.map(tick).map(([v, o]) => (
        <g key={'ty' + v} opacity={o * p}>
          <line x1={x0 - 10} y1={sy(b, v)} x2={x0} y2={sy(b, v)} stroke={C.axis} strokeWidth="2" />
          <text x={x0 - 20} y={sy(b, v) + 7} textAnchor="end" fill={C.muted} style={{fontFamily: MONO, fontSize: 20}}>
            {tickFmt(v)}
          </text>
        </g>
      ))}
      {xLabel ? (
        <text x={b.left + b.width + 24} y={y0 + 38} textAnchor="end" fill={C.muted} opacity={p} style={{fontFamily: SANS, fontSize: 22, fontWeight: 300}}>
          {xLabel}
        </text>
      ) : null}
      {yLabel ? (
        <text x={x0 + 18} y={b.top - 14} fill={C.muted} opacity={p} style={{fontFamily: SANS, fontSize: 22, fontWeight: 300}}>
          {yLabel}
        </text>
      ) : null}
    </g>
  );
};

/** A stroke that draws itself as p goes 0 → 1. */
export const Draw: React.FC<{d: string; p: number; color: string; width?: number; dash?: string; opacity?: number}> = ({d, p, color, width = 4, dash, opacity = 1}) => {
  if (!d || p <= 0) return null;
  if (dash) return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} opacity={opacity * Math.min(1, p * 2)} strokeLinecap="round" />;
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} opacity={opacity} />;
};

export const Dot: React.FC<{x: number; y: number; color: string; o?: number; pulse?: number}> = ({x, y, color, o = 1, pulse = 0}) =>
  o <= 0 ? null : (
    <g opacity={o}>
      <circle cx={x} cy={y} r={18 + pulse * 22} fill={color} opacity={0.18 * (1 - pulse * 0.6)} />
      <circle cx={x} cy={y} r={8.5} fill={color} />
      <circle cx={x} cy={y} r={3} fill={C.bg} opacity={0.35} />
    </g>
  );

// ------------------------------------------------------------------ chapter chrome

export type Line = [number, number, string];

export const Narration: React.FC<{t: number; lines: Line[]}> = ({t, lines}) => (
  <>
    {lines.map(([a, z, text]) => {
      const o = span(t, a, z, 0.4, 0.35);
      if (o <= 0) return null;
      const rise = (1 - ramp(t, a, a + 0.6, Easing.out(Easing.cubic))) * 10;
      return (
        <div
          key={a}
          style={{
            position: 'absolute',
            left: 160,
            right: 160,
            top: 905,
            height: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            opacity: o,
            transform: `translateY(${rise}px)`,
            fontFamily: SANS,
            fontWeight: 300,
            fontSize: 34,
            lineHeight: 1.4,
            color: C.ink,
          }}
        >
          <div>
            <Rich text={text} size={34} />
          </div>
        </div>
      );
    })}
  </>
);

export const Header: React.FC<{t: number; chapter: number; title: string; duration: number}> = ({t, chapter, title, duration}) => (
  <div
    style={{
      position: 'absolute',
      left: 160,
      right: 160,
      top: 52,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      opacity: ramp(t, 4.2, 5.0) * (1 - ramp(t, duration - 0.8, duration)),
    }}
  >
    <Mono size={15} style={{letterSpacing: '0.26em'}}>
      {SERIES} · {String(chapter).padStart(2, '0')} · {title}
    </Mono>
    <div style={{display: 'flex', gap: 8}}>
      {Array.from({length: CHAPTERS}, (_, i) => i + 1).map((c) => (
        <div key={c} style={{width: 64, height: 3, borderRadius: 2, background: C.faint, overflow: 'hidden'}}>
          <div style={{width: `${c < chapter ? 100 : c === chapter ? clamp01(t / duration) * 100 : 0}%`, height: '100%', background: c === chapter ? C.f : C.muted}} />
        </div>
      ))}
    </div>
  </div>
);

export const TitleCard: React.FC<{t: number; chapter: number; title: string; subtitle: string; glyph: string; until?: number}> = ({
  t,
  chapter,
  title,
  subtitle,
  glyph,
  until = 4.5,
}) => {
  const o = span(t, 0.2, until, 0.9, 0.7);
  if (o <= 0) return null;
  const p = ramp(t, 0.2, 1.6, Easing.out(Easing.cubic));
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: o}}>
      <div style={{position: 'absolute', right: 120, top: 120, opacity: 0.06, transform: `translateY(${(1 - p) * 30}px)`}}>
        <Tex tex={glyph} size={460} color={C.ink} />
      </div>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(${(1 - p) * 24}px)`, filter: `blur(${(1 - p) * 8}px)`}}>
        <Mono size={18} color={C.muted} style={{letterSpacing: '0.42em'}}>
          {SERIES} · Chapter {chapter}
        </Mono>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 168, lineHeight: 1.1, letterSpacing: '-0.03em', color: C.ink, marginTop: 18}}>{title}</div>
        <div style={{fontFamily: SANS, fontWeight: 300, fontSize: 40, color: C.muted, marginTop: 10}}>{subtitle}</div>
      </div>
    </AbsoluteFill>
  );
};

export const Recap: React.FC<{t: number; at: number; end: number; statement: string[]; tex: string; next: string}> = ({t, at, end, statement, tex, next}) => {
  const cover = ramp(t, at, at + 0.8);
  if (cover <= 0) return null;
  const out = 1 - ramp(t, end - 0.7, end);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, opacity: cover}}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: out}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, textAlign: 'center'}}>
          <Reveal t={t} at={at + 0.5}>
            <Mono size={16} color={C.f} style={{letterSpacing: '0.42em'}}>
              Key idea
            </Mono>
          </Reveal>
          {statement.map((line, i) => (
            <Reveal key={i} t={t} at={at + 0.8 + i * 0.45}>
              <div style={{fontFamily: SANS, fontWeight: 300, fontSize: 50, lineHeight: 1.3, color: C.ink}}>
                <Rich text={line} size={50} />
              </div>
            </Reveal>
          ))}
          <Reveal t={t} at={at + 1.0 + statement.length * 0.45}>
            <div style={{marginTop: 16}}>
              <Tex tex={tex} size={56} />
            </div>
          </Reveal>
          <Reveal t={t} at={at + 1.6 + statement.length * 0.45}>
            <Mono size={16} style={{marginTop: 30, display: 'block'}}>
              {next}
            </Mono>
          </Reveal>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Board: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{backgroundColor: C.bg, backgroundImage: 'radial-gradient(ellipse at 45% 40%, #161A22 0%, #0E1014 70%)', fontFamily: SANS, color: C.ink}}>
    {children}
  </AbsoluteFill>
);

// ------------------------------------------------------------------ sound

export type VoiceLine = {from: number; to: number; text?: string; say: string};
export type VoiceScript = {voice: string; lines: VoiceLine[]};
export type Speech = {start: number; end: number};

/** Caption windows come from the same script the narrator reads. */
export const captions = (script: VoiceScript): Line[] =>
  script.lines.filter((l) => l.text).map((l) => [l.from, l.to, l.text as string]);

/** 0 → 1 while the narrator is speaking, with soft edges. */
const speaking = (t: number, speech: Speech[]) => {
  let v = 0;
  for (const {start, end} of speech) {
    v = Math.max(v, Math.min(ramp(t, start - 0.3, start, Easing.out(Easing.quad)), 1 - ramp(t, end, end + 0.6, Easing.inOut(Easing.quad))));
  }
  return v;
};

/** Score under the voiceover: the music dips while the narrator speaks. */
export const Soundtrack: React.FC<{score: string; voice: string; speech: Speech[]}> = ({score, voice, speech}) => (
  <>
    <Audio src={score} volume={(f) => 1 - 0.42 * speaking(f / FPS, speech)} />
    <Audio src={voice} />
  </>
);
