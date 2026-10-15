import React from 'react';
import {Easing} from 'remotion';
import {MONO, SANS, SERIF} from '../../studio/lib/fonts';
import {
  areaPath,
  Board,
  Box,
  C,
  clamp01,
  curvePath,
  Dot,
  Draw,
  fmt,
  Header,
  lerp,
  mixHex,
  Mono,
  Narration,
  Place,
  ramp,
  Readout,
  Recap,
  Reveal,
  span,
  sx,
  sy,
  Tex,
  TitleCard,
  useT,
  useUid,
} from './kit';
import {captions, Soundtrack, Speech, VoiceScript} from './kit';
import script from './voice/ch04.json';
import speech from './voice/ch04.timing.json';
import score from './assets/ch04-score.mp3';
import voice from './assets/ch04-voice.mp3';

export const CH4_SECONDS = 77;

const LINES = captions(script as VoiceScript);

/** sin x / x, with the hole at 0 filled in so paths can pass through it (the ring covers it). */
const f = (x: number) => (x === 0 ? 1 : Math.sin(x) / x);
/** The jump: from the left it heads to 1/2, from the right to 1. */
const gL = (x: number) => 0.5 - 0.03 * x * x;
const gR = (x: number) => 1 - 0.04 * x * x;

// ------------------------------------------------------------------ camera
// The plot is one window onto the plane. A view keeps x symmetric about 0 and puts the
// hole (0, 1) at height u of the plot; widths interpolate in log space, so a zoom feels even.

type View = {wx: number; h: number; u: number};
const V0: View = {wx: 12.5, h: 1.7, u: 0.835}; // the whole curve
const VZ: View = {wx: 0.0125, h: 0.0017, u: 0.5}; // a thousand times closer
const VE: View = {wx: 3.6, h: 1.55, u: 0.806}; // the ε–δ game

const PLOT = {left: 180, top: 170, width: 960, height: 620};

const mixView = (a: View, b: View, p: number): View => ({
  wx: Math.exp(lerp(Math.log(a.wx), Math.log(b.wx), p)),
  h: Math.exp(lerp(Math.log(a.h), Math.log(b.h), p)),
  u: lerp(a.u, b.u, p),
});

const ZOOM_IN: [number, number] = [24.6, 29.4];
const viewAt = (t: number): View =>
  t < 32 ? mixView(V0, VZ, ramp(t, ZOOM_IN[0], ZOOM_IN[1], Easing.inOut(Easing.sin))) : mixView(VZ, VE, ramp(t, 34.8, 37.6, Easing.inOut(Easing.cubic)));

const boxOf = (v: View): Box => {
  const y0 = 1 - v.u * v.h;
  return {...PLOT, x0: -v.wx, x1: v.wx, y0, y1: y0 + v.h};
};

// ------------------------------------------------------------------ a grid that zooms
// Ticks come from a nested 1-5-10 ladder (every step divides the next, so labels of two
// sizes never interleave). Each step fades in as its spacing on screen grows, so lines
// and labels arrive smoothly instead of popping as the camera moves.

type Tick = {v: number; line: number; label: number};

const ticksFor = (a: number, z: number, px: number) => {
  const range = z - a;
  const lo = Math.floor(Math.log10(range)) - 3;
  const ticks = new Map<string, Tick>();
  let labelStep = Infinity;
  for (let k = lo; k <= lo + 5; k++) {
    for (const m of [1, 5]) {
      const step = m * 10 ** k;
      const spacing = (step / range) * px;
      const line = clamp01((spacing - 50) / 50);
      if (line <= 0) continue;
      const label = clamp01((spacing - 85) / 45);
      if (label > 0) labelStep = Math.min(labelStep, step);
      for (let i = Math.ceil(a / step); i * step <= z; i++) {
        const v = i * step;
        const key = v.toPrecision(9);
        const prev = ticks.get(key);
        ticks.set(key, {v, line: Math.max(line, prev?.line ?? 0), label: Math.max(label, prev?.label ?? 0)});
      }
    }
  }
  const dec = Math.max(0, -Math.floor(Math.log10(labelStep) + 1e-9));
  const text = (v: number) => {
    const s = String(Number(v.toFixed(dec)));
    return s.startsWith('-') ? `−${s.slice(1)}` : s;
  };
  return {ticks: [...ticks.values()], text};
};

const Grid: React.FC<{b: Box; p: number}> = ({b, p}) => {
  const xs = ticksFor(b.x0, b.x1, b.width);
  const ys = ticksFor(b.y0, b.y1, b.height);
  const bottom = b.top + b.height;
  const yAxis = sx(b, 0);
  const xAxis = b.y0 < 0 && b.y1 > 0 ? sy(b, 0) : null;
  return (
    <g opacity={p}>
      {xs.ticks.map(({v, line}) => (
        <line key={'gx' + v} x1={sx(b, v)} y1={b.top} x2={sx(b, v)} y2={bottom} stroke={C.grid} strokeWidth="1.5" opacity={line} />
      ))}
      {ys.ticks.map(({v, line}) => (
        <line key={'gy' + v} x1={b.left} y1={sy(b, v)} x2={b.left + b.width} y2={sy(b, v)} stroke={C.grid} strokeWidth="1.5" opacity={line} />
      ))}
      {xAxis !== null ? <line x1={b.left - 10} y1={xAxis} x2={b.left + b.width + 10} y2={xAxis} stroke={C.axis} strokeWidth="2.5" /> : null}
      <line x1={yAxis} y1={b.top - 10} x2={yAxis} y2={bottom + 10} stroke={C.axis} strokeWidth="2.5" />
      {xs.ticks.map(({v, label}) =>
        label > 0 ? (
          <text key={'tx' + v} x={sx(b, v)} y={bottom + 38} textAnchor="middle" fill={C.muted} opacity={label} style={{fontFamily: MONO, fontSize: 20}}>
            {xs.text(v)}
          </text>
        ) : null,
      )}
      {ys.ticks.map(({v, label}) =>
        label > 0 ? (
          <text key={'ty' + v} x={b.left - 18} y={sy(b, v) + 7} textAnchor="end" fill={C.muted} opacity={label} style={{fontFamily: MONO, fontSize: 20}}>
            {ys.text(v)}
          </text>
        ) : null,
      )}
      <text x={b.left + b.width + 24} y={bottom + 38} textAnchor="start" fill={C.muted} style={{fontFamily: SANS, fontSize: 22, fontWeight: 300}}>
        x
      </text>
    </g>
  );
};

/** A path through fn at the given x values (any order, so a curve can be drawn toward a point). */
const pathThrough = (b: Box, fn: (x: number) => number, a: number, z: number, n = 260) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const x = a + ((z - a) * i) / n;
    d += `${i ? 'L' : 'M'}${sx(b, x).toFixed(2)},${sy(b, fn(x)).toFixed(2)}`;
  }
  return d;
};

const Hole: React.FC<{x: number; y: number; o: number; color?: string; pulse?: number}> = ({x, y, o, color = C.f, pulse = 0}) =>
  o <= 0 ? null : (
    <g opacity={o}>
      {pulse > 0 ? <circle cx={x} cy={y} r={14 + pulse * 26} fill="none" stroke={color} strokeWidth="2" opacity={0.5 * (1 - pulse)} /> : null}
      <circle cx={x} cy={y} r={10} fill={C.bg} stroke={color} strokeWidth="3.5" />
    </g>
  );

// ------------------------------------------------------------------ act 1: the move every chapter made

const PANEL_W = 440;
const PANEL_H = 280;
const PANEL_Y = 250;
const panelLeft = (i: number) => 960 + (i - 1) * (PANEL_W + 70) - PANEL_W / 2;
const mini = (i: number): Box => ({left: panelLeft(i) + 40, top: PANEL_Y + 34, width: PANEL_W - 80, height: PANEL_H - 74, x0: 0, x1: 2.1, y0: 0, y1: 4.6});
const sq = (x: number) => x * x;

const PANELS = [
  {kicker: 'Chapter 1 · slope', tex: 'h \\to 0'},
  {kicker: 'Chapter 2 · area', tex: '\\Delta t \\to 0'},
  {kicker: 'Chapter 3 · growth', tex: 'dx \\to 0'},
];

const Montage: React.FC<{t: number; uid: string}> = ({t, uid}) => {
  const out = 1 - ramp(t, 11.2, 12.2);
  if (t < 4.6 || out <= 0) return null;
  const p = ramp(t, 5.8, 11.0, Easing.inOut(Easing.sin));
  const h = 1.1 * 10 ** (-2.4 * p);
  const n = 2 ** (1 + Math.min(6, Math.floor(p * 6.999)));
  const dx = 0.5 * 10 ** (-1.6 * p);
  return (
    <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
      {PANELS.map((_, i) => {
        const b = mini(i);
        const o = ramp(t, 4.8 + i * 0.25, 5.6 + i * 0.25, Easing.out(Easing.cubic)) * out;
        const base = sy(b, 0);
        return (
          <g key={i} opacity={o} transform={`translate(0 ${(1 - o) * 16})`}>
            <defs>
              <clipPath id={`${uid}-m${i}`}>
                <rect x={b.left} y={b.top - 10} width={b.width} height={b.height + 10} />
              </clipPath>
            </defs>
            <rect x={panelLeft(i)} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx={14} fill="#12151B" stroke={C.faint} strokeWidth="1.5" />
            <line x1={b.left} y1={base} x2={b.left + b.width} y2={base} stroke={C.axis} strokeWidth="2" />
            <line x1={b.left} y1={base} x2={b.left} y2={b.top} stroke={C.axis} strokeWidth="2" />
            <g clipPath={`url(#${uid}-m${i})`}>
              {i === 1
                ? Array.from({length: n}, (_, k) => {
                    const w = 2 / n;
                    const x = k * w;
                    return <rect key={k} x={sx(b, x)} y={sy(b, sq(x))} width={sx(b, x + w) - sx(b, x)} height={base - sy(b, sq(x))} fill={C.a} opacity={0.55} stroke={n <= 32 ? '#12151B' : 'none'} strokeWidth="1" />;
                  })
                : null}
              {i === 2 ? (
                <>
                  <path d={areaPath(b, sq, 0, 1.3)} fill={C.a} opacity={0.32} />
                  <path d={areaPath(b, sq, 1.3, 1.3 + dx)} fill={C.d} opacity={0.9} />
                </>
              ) : null}
              <path d={curvePath(b, sq, 0, 2.1, 120)} fill="none" stroke={C.f} strokeWidth="3.5" strokeLinecap="round" />
              {i === 0 ? (
                <line
                  x1={sx(b, 0.1)}
                  y1={sy(b, 1 + ((sq(1 + h) - 1) / h) * (0.1 - 1))}
                  x2={sx(b, 2.1)}
                  y2={sy(b, 1 + ((sq(1 + h) - 1) / h) * (2.1 - 1))}
                  stroke={mixHex('#D8D2C8', C.d, p)}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              ) : null}
            </g>
            {i === 0 ? (
              <>
                <circle cx={sx(b, 1)} cy={sy(b, 1)} r={6} fill={C.ink} />
                <circle cx={sx(b, 1 + h)} cy={sy(b, sq(1 + h))} r={6} fill={C.ink} opacity={1 - ramp(t, 10.2, 10.8)} />
              </>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};

/** The three "→ 0" labels fly together and become one lim. */
const Merge: React.FC<{t: number}> = ({t}) => {
  const m = ramp(t, 11.3, 12.5, Easing.inOut(Easing.cubic));
  const big = span(t, 11.9, 14.1, 0.8, 0.6);
  return (
    <>
      {PANELS.map((p, i) => {
        const o = ramp(t, 5.0 + i * 0.25, 5.8 + i * 0.25) * (1 - ramp(t, 11.8, 12.4));
        if (o <= 0) return null;
        const cx = panelLeft(i) + PANEL_W / 2;
        return (
          <React.Fragment key={i}>
            <Place x={cx} y={PANEL_Y - 28} ax={0.5} style={{opacity: o * (1 - m)}}>
              <Mono size={14}>{p.kicker}</Mono>
            </Place>
            <Place x={lerp(cx, 960, m)} y={lerp(PANEL_Y + PANEL_H + 52, 470, m)} ax={0.5} style={{opacity: o, transform: `translate(-50%, -50%) scale(${1 + m * 1.6})`}}>
              <Tex tex={p.tex} size={40} color={mixHex(C.ink, C.bright, ramp(t, 9.6, 10.6))} />
            </Place>
          </React.Fragment>
        );
      })}
      {big > 0 ? (
        <>
          <Place x={960} y={450} ax={0.5} style={{opacity: big, transform: `translate(-50%, -50%) scale(${lerp(0.92, 1, ramp(t, 11.9, 13.2, Easing.out(Easing.cubic)))})`}}>
            <Tex tex="\lim" size={230} color={C.bright} />
          </Place>
          <Place x={960} y={640} ax={0.5} style={{opacity: big * ramp(t, 12.4, 13.0)}}>
            <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 52, color: C.muted}}>where the answer is heading</span>
          </Place>
        </>
      ) : null}
    </>
  );
};

// ------------------------------------------------------------------ act 2: the hole

const ROWS = [1, 0.1, 0.01, 0.001];

/** Mono labels are uppercase; keep Greek letters lowercase (Δ would read as a different symbol). */
const greek = (s: string) => <span style={{textTransform: 'none', letterSpacing: 0, fontSize: '1.25em'}}>{s}</span>;
// Two walkers close in on 0 from both sides, 6 → 0.0008, between 19.6 s and 23.8 s.
const walkAt = (t: number) => 6 * 10 ** (-3.9 * ramp(t, 19.6, 23.8, Easing.inOut(Easing.sin)));

// ------------------------------------------------------------------ act 3: the ε–δ challenge

/** The largest δ with |f(x) − 1| < ε for 0 < |x| < δ (f falls monotonically on (0, π)). */
const deltaFor = (eps: number) => {
  let a = 0;
  let z = Math.PI;
  for (let i = 0; i < 50; i++) {
    const m = (a + z) / 2;
    if (1 - f(m) < eps) a = m;
    else z = m;
  }
  return a;
};

const ROUNDS: [number, number][] = [
  [0.3, 46.4],
  [0.12, 52.0],
  [0.04, 54.6],
];

const epsAt = (t: number) => {
  if (t < 50.4) return 0.3;
  if (t < 53.0) return lerp(0.3, 0.12, ramp(t, 50.4, 51.8));
  return lerp(0.12, 0.04, ramp(t, 53.0, 54.4));
};

// ------------------------------------------------------------------ act 4: the jump

const JUMP_DELTA = 0.6;
const JUMP_EPS = 0.12;
const levelAt = (t: number) => (t < 67.4 ? 1 : lerp(1, 0.5, ramp(t, 67.4, 68.3)));

export const Ch4Limit: React.FC = () => {
  const t = useT();
  const uid = useUid();
  const b = boxOf(viewAt(t));

  const plotOn = span(t, 14.0, 71.2, 0.6, 0.8);
  const grid = ramp(t, 14.2, 15.2);

  // act 2: draw both halves inward, toward the hole
  const draw = ramp(t, 14.8, 17.0, Easing.inOut(Easing.sin));
  const sinOn = 1 - ramp(t, 60.2, 60.9);
  const holeOn = ramp(t, 16.9, 17.3) * sinOn;
  const holePulse = t > 17 && t < 18.6 ? ramp(t, 17.0, 18.6) : 0;
  const xd = walkAt(t);
  const walkers = span(t, 19.4, 24.8, 0.4, 0.5);
  const zoom = 12.5 / viewAt(t).wx;

  // act 3
  const bandOn = ramp(t, 39.8, 41.0, Easing.out(Easing.cubic)) * (1 - ramp(t, 59.8, 60.6));
  const eps = epsAt(t) * bandOn;
  const windowOn = ramp(t, 45.0, 46.4, Easing.out(Easing.cubic)) * (1 - ramp(t, 59.8, 60.6));
  const delta = deltaFor(epsAt(t)) * windowOn;
  const merged = clamp01((64 - (sy(b, 1 - eps) - sy(b, 1 + eps))) / 14);

  // act 4
  const jumpDraw = ramp(t, 60.8, 62.3, Easing.inOut(Easing.sin));
  const jumpOn = ramp(t, 60.8, 61.2);
  const xj = 3 * 10 ** (-2.6 * ramp(t, 62.2, 64.8, Easing.inOut(Easing.sin)));
  const jumpWalkers = span(t, 62.0, 65.6, 0.4, 0.5);
  const jBand = ramp(t, 65.6, 66.4, Easing.out(Easing.cubic));
  const jWindow = ramp(t, 66.0, 66.8, Easing.out(Easing.cubic));
  const L = levelAt(t);
  const escL = clamp01((Math.abs(0.5 - L) - JUMP_EPS) / 0.08) * jWindow;
  const escR = clamp01((Math.abs(1 - L) - JUMP_EPS) / 0.08) * jWindow;

  const bandRect = (lvl: number, e: number, color: string, o: number) =>
    o <= 0 ? null : (
      <g opacity={o}>
        <rect x={b.left} y={sy(b, lvl + e)} width={b.width} height={sy(b, lvl - e) - sy(b, lvl + e)} fill={color} opacity={0.14} />
        <line x1={b.left} y1={sy(b, lvl + e)} x2={b.left + b.width} y2={sy(b, lvl + e)} stroke={color} strokeWidth="2" opacity={0.85} />
        <line x1={b.left} y1={sy(b, lvl - e)} x2={b.left + b.width} y2={sy(b, lvl - e)} stroke={color} strokeWidth="2" opacity={0.85} />
      </g>
    );
  const windowRect = (d: number, o: number) =>
    o <= 0 || d <= 0 ? null : (
      <g opacity={o}>
        <rect x={sx(b, -d)} y={b.top} width={sx(b, d) - sx(b, -d)} height={b.height} fill={C.d} opacity={0.1} />
        <line x1={sx(b, -d)} y1={b.top} x2={sx(b, -d)} y2={b.top + b.height} stroke={C.d} strokeWidth="2" opacity={0.85} />
        <line x1={sx(b, d)} y1={b.top} x2={sx(b, d)} y2={b.top + b.height} stroke={C.d} strokeWidth="2" opacity={0.85} />
      </g>
    );

  return (
    <Board>
      <Soundtrack score={score} voice={voice} speech={speech as Speech[]} />

      <Montage t={t} uid={uid} />

      {plotOn > 0 ? (
        <svg width="1920" height="1080" style={{position: 'absolute', inset: 0, opacity: plotOn}}>
          <defs>
            <clipPath id={`${uid}-plot`}>
              <rect x={b.left} y={b.top} width={b.width} height={b.height} />
            </clipPath>
          </defs>
          <Grid b={b} p={grid} />

          <g clipPath={`url(#${uid}-plot)`}>
            {bandRect(1, eps, C.a, bandOn)}
            {windowRect(delta, windowOn)}
            {jumpOn > 0 ? (
              <>
                {bandRect(L, JUMP_EPS, C.a, jBand)}
                {windowRect(JUMP_DELTA, jWindow)}
              </>
            ) : null}

            {/* sin x / x, drawn from both ends toward 0 */}
            {sinOn > 0 ? (
              <g opacity={sinOn}>
                <Draw d={pathThrough(b, f, b.x0, 0)} p={draw} color={C.f} width={4.5} />
                <Draw d={pathThrough(b, f, b.x1, 0)} p={draw} color={C.f} width={4.5} />
                {windowOn > 0 && delta > 0 ? <path d={pathThrough(b, f, -delta, delta, 120)} fill="none" stroke="#FFE2B3" strokeWidth="7" strokeLinecap="round" opacity={windowOn} /> : null}
              </g>
            ) : null}

            {/* the jump */}
            {jumpOn > 0 ? (
              <g opacity={jumpOn}>
                <Draw d={pathThrough(b, gL, b.x0, 0)} p={jumpDraw} color={C.f} width={4.5} />
                <Draw d={pathThrough(b, gR, b.x1, 0)} p={jumpDraw} color={C.f} width={4.5} />
                {escL > 0 ? <path d={pathThrough(b, gL, -JUMP_DELTA, 0, 60)} fill="none" stroke={C.a} strokeWidth="8" strokeLinecap="round" opacity={escL} /> : null}
                {escR > 0 ? <path d={pathThrough(b, gR, 0, JUMP_DELTA, 60)} fill="none" stroke={C.a} strokeWidth="8" strokeLinecap="round" opacity={escR} /> : null}
              </g>
            ) : null}
          </g>

          {/* walkers closing in on the hole */}
          {walkers > 0
            ? [-1, 1].map((s) => <Dot key={s} x={sx(b, s * xd)} y={sy(b, f(xd))} color={C.ink} o={walkers} />)
            : null}
          <Hole x={sx(b, 0)} y={sy(b, 1)} o={holeOn} pulse={holePulse} />
          {windowOn > 0 && delta > 0
            ? [-1, 1].map((s) => <circle key={s} cx={sx(b, s * delta)} cy={sy(b, f(delta))} r={7} fill={C.d} opacity={windowOn} />)
            : null}

          {jumpWalkers > 0 ? (
            <>
              <Dot x={sx(b, -xj)} y={sy(b, gL(-xj))} color={C.ink} o={jumpWalkers} />
              <Dot x={sx(b, xj)} y={sy(b, gR(xj))} color={C.ink} o={jumpWalkers} />
            </>
          ) : null}
          <Hole x={sx(b, 0)} y={sy(b, 0.5)} o={ramp(t, 62.1, 62.4) * jumpOn} />
          <Hole x={sx(b, 0)} y={sy(b, 1)} o={ramp(t, 62.1, 62.4) * jumpOn} />
        </svg>
      ) : null}

      {/* labels on the plot */}
      <div style={{opacity: plotOn}}>
        <Place x={sx(b, 5.2)} y={sy(b, 0.78)} ax={0}>
          <Reveal t={t} at={16.4} until={24.6}>
            <Tex tex="f(x) = \frac{\sin x}{x}" size={40} color={C.f} />
          </Reveal>
        </Place>
        <Place x={sx(b, 0) + 34} y={sy(b, 1) - 52} ax={0}>
          <Reveal t={t} at={17.4} until={19.6}>
            <Tex tex="\tfrac{0}{0}\ ?" size={40} color={C.ink} />
          </Reveal>
        </Place>
        {t > 24.4 && t < 34.8 ? (
          <Place x={b.left + 22} y={b.top + 30} ax={0} style={{opacity: span(t, 24.6, 34.6, 0.4, 0.5)}}>
            <Mono size={16} color={C.ink}>
              zoom ×{zoom < 9.95 ? zoom.toFixed(1).replace(/\.0$/, '') : Math.round(zoom)}
            </Mono>
          </Place>
        ) : null}
        {bandOn > 0 ? (
          <>
            <Place x={b.left + b.width + 14} y={sy(b, 1 + eps)} ax={0} style={{opacity: bandOn * (1 - merged)}}>
              <Tex tex="1 + \varepsilon" size={26} color={C.a} />
            </Place>
            <Place x={b.left + b.width + 14} y={sy(b, 1 - eps)} ax={0} style={{opacity: bandOn * (1 - merged)}}>
              <Tex tex="1 - \varepsilon" size={26} color={C.a} />
            </Place>
            <Place x={b.left + b.width + 14} y={sy(b, 1)} ax={0} style={{opacity: bandOn * merged}}>
              <Tex tex="1 \pm \varepsilon" size={26} color={C.a} />
            </Place>
          </>
        ) : null}
        {windowOn > 0 && delta > 0.02 ? (
          <>
            <Place x={sx(b, -delta)} y={b.top - 22} ax={0.5} style={{opacity: windowOn}}>
              <Tex tex="-\delta" size={28} color={C.d} />
            </Place>
            <Place x={sx(b, delta)} y={b.top - 22} ax={0.5} style={{opacity: windowOn}}>
              <Tex tex="\delta" size={28} color={C.d} />
            </Place>
          </>
        ) : null}
        {jBand > 0 ? (
          <Place x={b.left + 18} y={sy(b, L + JUMP_EPS) - 24} ax={0} style={{opacity: jBand}}>
            <Tex tex={L > 0.99 ? 'L = 1\\,?' : L < 0.51 ? 'L = \\tfrac12\\,?' : 'L'} size={28} color={C.a} />
          </Place>
        ) : null}
      </div>

      {/* right panel · act 2 */}
      <Place x={1270} y={262} ax={0}>
        <Reveal t={t} at={17.8} until={30.0}>
          <Tex tex="f(0) = \frac{\sin 0}{0} = \frac{0}{0}" size={38} />
        </Reveal>
      </Place>
      {t > 19.4 ? (
        <Place x={1270} y={400} ax={0} style={{opacity: span(t, 19.6, 30.0, 0.5, 0.5), display: 'flex', gap: 56}}>
          <Readout label="x, either side" value={`±${xd < 0.01 ? xd.toFixed(4) : xd.toFixed(3)}`} size={44} />
          <Readout label="f(x)" value={fmt(f(xd), 7)} size={44} color={C.f} />
        </Place>
      ) : null}
      {t > 19.4 ? (
        <div style={{position: 'absolute', left: 1270, top: 490, width: 470, opacity: span(t, 19.6, 30.0, 0.5, 0.5)}}>
          <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.faint}`, paddingBottom: 10}}>
            <Mono size={14}>x</Mono>
            <Mono size={14}>sin x / x</Mono>
          </div>
          {ROWS.map((r) =>
            xd <= r * 1.0001 ? (
              <div key={r} style={{display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 26, color: C.ink, padding: '8px 0', borderBottom: `1px solid ${C.faint}`, fontVariantNumeric: 'tabular-nums'}}>
                <span>±{r < 0.01 ? r.toFixed(3) : r < 1 ? r.toFixed(2) : r.toFixed(0)}</span>
                <span style={{color: r < 0.05 ? C.bright : C.ink}}>{fmt(f(r), 7)}</span>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      <Place x={1270} y={380} ax={0}>
        <Reveal t={t} at={30.4} until={34.8}>
          <div style={{padding: '26px 30px', border: `1.5px solid ${C.f}`, borderRadius: 10}}>
            <Tex tex="\lim_{x \to 0} \frac{\sin x}{x} = 1" size={52} />
          </div>
        </Reveal>
      </Place>
      <Place x={1270} y={530} ax={0}>
        <Reveal t={t} at={31.4} until={34.8}>
          <Mono size={15}>where it is heading · not where it is</Mono>
        </Reveal>
      </Place>

      {/* right panel · act 3 */}
      <Place x={1270} y={250} ax={0}>
        <Reveal t={t} at={35.4} until={55.2}>
          <Mono size={15}>The challenge</Mono>
        </Reveal>
      </Place>
      <Place x={1270} y={310} ax={0}>
        <Reveal t={t} at={40.0} until={55.2}>
          <span style={{fontFamily: SANS, fontWeight: 300, fontSize: 32}}>
            You pick a band <Tex tex="\varepsilon" size={34} color={C.a} inline /> around 1.
          </span>
        </Reveal>
      </Place>
      <Place x={1270} y={364} ax={0}>
        <Reveal t={t} at={45.2} until={55.2}>
          <span style={{fontFamily: SANS, fontWeight: 300, fontSize: 32}}>
            I find a window <Tex tex="\delta" size={34} color={C.d} inline /> around 0.
          </span>
        </Reveal>
      </Place>
      {t > 45 ? (
        <Place x={1270} y={470} ax={0} style={{opacity: span(t, 45.4, 55.2, 0.5, 0.5), display: 'flex', gap: 56}}>
          <Readout label={<>band {greek('ε')}</>} value={fmt(epsAt(t), 3)} size={44} color={C.a} />
          <Readout label={<>window {greek('δ')}</>} value={fmt(deltaFor(epsAt(t)), 3)} size={44} color={C.d} />
        </Place>
      ) : null}
      {t > 46 ? (
        <div style={{position: 'absolute', left: 1270, top: 560, width: 470, opacity: span(t, 46.2, 55.2, 0.5, 0.5)}}>
          <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.faint}`, paddingBottom: 10}}>
            <Mono size={14}>your {greek('ε')}</Mono>
            <Mono size={14}>my {greek('δ')}</Mono>
          </div>
          {ROUNDS.map(([e, at]) =>
            t >= at ? (
              <div key={e} style={{display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 26, padding: '8px 0', borderBottom: `1px solid ${C.faint}`, fontVariantNumeric: 'tabular-nums', opacity: ramp(t, at, at + 0.4)}}>
                <span style={{color: C.a}}>{fmt(e, 3)}</span>
                <span style={{color: C.d}}>{fmt(deltaFor(e), 3)}</span>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      <Place x={1270} y={262} ax={0}>
        <Reveal t={t} at={55.6} until={60.2}>
          <Mono size={15}>The definition</Mono>
        </Reveal>
      </Place>
      <Place x={1270} y={340} ax={0}>
        <Reveal t={t} at={56.0} until={60.2}>
          <Tex tex="\text{for every } \textcolor{#F07B6A}{\varepsilon} > 0 \text{ there is a } \textcolor{#5CC8C2}{\delta} > 0" size={32} />
        </Reveal>
      </Place>
      <Place x={1270} y={420} ax={0}>
        <Reveal t={t} at={56.8} until={60.2}>
          <Tex tex="0 < |x| < \textcolor{#5CC8C2}{\delta} \;\Rightarrow\; |f(x) - 1| < \textcolor{#F07B6A}{\varepsilon}" size={32} />
        </Reveal>
      </Place>

      {/* right panel · act 4 */}
      <Place x={1270} y={290} ax={0}>
        <Reveal t={t} at={62.6} until={70.6}>
          <Tex tex="\lim_{x \to 0^-} g(x) = \tfrac12" size={40} />
        </Reveal>
      </Place>
      <Place x={1270} y={390} ax={0}>
        <Reveal t={t} at={63.6} until={70.6}>
          <Tex tex="\lim_{x \to 0^+} g(x) = 1" size={40} />
        </Reveal>
      </Place>
      {(
        [
          ['L = 1', 'the left side escapes', 66.4, 500],
          ['L = ½', 'the right side escapes', 68.4, 556],
        ] as [string, string, number, number][]
      ).map(([lv, why, at, y]) => (
        <Place key={at} x={1270} y={y} ax={0}>
          <Reveal t={t} at={at} until={70.6}>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 18, fontFamily: SANS, fontWeight: 300, fontSize: 28}}>
              <span style={{fontFamily: MONO, fontSize: 24, color: C.a, minWidth: 92}}>{lv}</span>
              <span style={{color: C.muted}}>✕ {why}</span>
            </div>
          </Reveal>
        </Place>
      ))}
      <Place x={1270} y={650} ax={0}>
        <Reveal t={t} at={69.0} until={70.6}>
          <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, color: C.ink}}>No limit at 0.</span>
        </Reveal>
      </Place>

      <Merge t={t} />

      <Header t={t} chapter={4} title="The limit" duration={CH4_SECONDS} />
      <Narration t={t} lines={LINES} />
      <TitleCard t={t} chapter={4} title="The limit" subtitle="Where a function is heading" glyph="\lim" />
      <Recap
        t={t}
        at={70.6}
        end={CH4_SECONDS}
        statement={['A limit is where a function is [[f|heading]], not where it is.', 'For every band [[a|$\\varepsilon$]], some window [[d|$\\delta$]] keeps it inside.']}
        tex="\lim_{x \to a} f(x) = L"
        next="Next · Chapter 5 · Sine and cosine"
      />
    </Board>
  );
};
