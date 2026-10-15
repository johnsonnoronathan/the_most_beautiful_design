import React from 'react';
import {Easing} from 'remotion';
import {MONO, SANS} from '../../studio/lib/fonts';
import {
  Board,
  Box,
  C,
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
  slopeLine,
  span,
  sx,
  sy,
  Tex,
  TitleCard,
  useT,
  useUid,
} from './kit';
import {captions, Soundtrack, Speech, VoiceScript} from './kit';
import script from './voice/ch05.json';
import speech from './voice/ch05.timing.json';
import score from './assets/ch05-score.mp3';
import voice from './assets/ch05-voice.mp3';

export const CH5_SECONDS = 80;

const LINES = captions(script as VoiceScript);
const TAU = 2 * Math.PI;

// ------------------------------------------------------------------ axes in multiples of π

const PI_TICKS: [number, string][] = [
  [Math.PI / 2, '\\tfrac{\\pi}{2}'],
  [Math.PI, '\\pi'],
  [(3 * Math.PI) / 2, '\\tfrac{3\\pi}{2}'],
  [TAU, '2\\pi'],
];

const WaveAxes: React.FC<{b: Box; p: number}> = ({b, p}) => (
  <g opacity={p}>
    {PI_TICKS.map(([v]) => (
      <line key={v} x1={sx(b, v)} y1={b.top} x2={sx(b, v)} y2={b.top + b.height} stroke={C.grid} strokeWidth="1.5" />
    ))}
    {[-1, 1].map((v) => (
      <line key={v} x1={b.left} y1={sy(b, v)} x2={b.left + b.width} y2={sy(b, v)} stroke={C.grid} strokeWidth="1.5" />
    ))}
    <line x1={b.left} y1={sy(b, 0)} x2={b.left + b.width} y2={sy(b, 0)} stroke={C.axis} strokeWidth="2.5" />
    <line x1={sx(b, Math.max(0, b.x0))} y1={b.top} x2={sx(b, Math.max(0, b.x0))} y2={b.top + b.height} stroke={C.axis} strokeWidth="2.5" />
    {PI_TICKS.map(([v]) => (
      <line key={'t' + v} x1={sx(b, v)} y1={sy(b, 0) - 8} x2={sx(b, v)} y2={sy(b, 0) + 8} stroke={C.axis} strokeWidth="2" />
    ))}
    {[-1, 1].map((v) => (
      <text key={'y' + v} x={b.left - 16} y={sy(b, v) + 7} textAnchor="end" fill={C.muted} style={{fontFamily: MONO, fontSize: 20}}>
        {v > 0 ? '1' : '−1'}
      </text>
    ))}
  </g>
);

/** π labels under a plot (HTML, so KaTeX can set them). */
const PiLabels: React.FC<{b: Box; p: number}> = ({b, p}) =>
  p <= 0 ? null : (
    <div style={{opacity: p}}>
      {PI_TICKS.map(([v, tex]) => (
        <Place key={v} x={sx(b, v)} y={b.top + b.height + 34} ax={0.5}>
          <Tex tex={tex} size={26} color={C.muted} inline />
        </Place>
      ))}
    </div>
  );

const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; color: string; width?: number; head?: number; opacity?: number}> = ({
  x1,
  y1,
  x2,
  y2,
  color,
  width = 4,
  head = 18,
  opacity = 1,
}) => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1 || opacity <= 0) return null;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const h = Math.min(head, len * 0.6);
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <path d={`M${x2},${y2}L${bx - uy * h * 0.5},${by + ux * h * 0.5}L${bx + uy * h * 0.5},${by - ux * h * 0.5}Z`} fill={color} />
    </g>
  );
};

// ------------------------------------------------------------------ act 1: the slope of sine

const B1: Box = {left: 180, top: 200, width: 960, height: 560, x0: -0.35, x1: 6.75, y0: -1.45, y1: 1.45};

// The tangent sweeps 0 → 2π, waits, then comes back to 0 for the slope-1 moment.
const sweepAt = (t: number) => (t < 19.8 ? TAU * ramp(t, 10.4, 15.2, Easing.inOut(Easing.sin)) : lerp(TAU, 0, ramp(t, 19.9, 21.0, Easing.inOut(Easing.cubic))));

// ------------------------------------------------------------------ act 2: the circle

const O = {x: 430, y: 500};
const R = 200;
// the wave beside the circle uses the same scale, so a point's height carries straight across
const G: Box = {left: 760, top: 300, width: 1000, height: 400, x0: 0, x1: TAU, y0: -1, y1: 1};
const TH = 0.9;

const thetaAt = (t: number) => (t < 36.2 ? TH * ramp(t, 27.6, 30.0, Easing.inOut(Easing.cubic)) : TH + TAU * ramp(t, 36.2, 40.4, (x) => x));
const onCircle = (th: number) => ({x: O.x + R * Math.cos(th), y: O.y - R * Math.sin(th)});
/** A point given in circle units (x right, y up), relative to the centre. */
const toScreen = (X: number, Y: number) => ({x: O.x + R * X, y: O.y - R * Y});

// ------------------------------------------------------------------ act 3: the cycle

const W = {x: 430, y: 520};
const WR = 190;
const STATES = [
  {tex: '\\sin x', color: C.f},
  {tex: '\\cos x', color: C.d},
  {tex: '-\\sin x', color: C.a},
  {tex: '-\\cos x', color: C.ink},
];
const NAMED = [53.3, 53.9, 54.6, 55.3];
const BACK = 56.5;
const STEPS = [57.6, 58.8, 60.0, 61.2];
const G3: Box = {left: 840, top: 330, width: 880, height: 380, x0: 0, x1: TAU, y0: -1.3, y1: 1.3};

const stationAngle = (k: number) => -Math.PI / 2 + (k * Math.PI) / 2; // screen angle: top, right, bottom, left
const atStation = (k: number, r = WR) => ({x: W.x + r * Math.cos(stationAngle(k)), y: W.y + r * Math.sin(stationAngle(k))});
const kAt = (t: number) => STEPS.reduce((k, s) => k + ramp(t, s, s + 0.8, Easing.inOut(Easing.cubic)), 0);
const haloAt = (t: number) =>
  [NAMED[1], NAMED[2], NAMED[3], BACK].reduce((k, s) => k + ramp(t, s - 0.15, s + 0.35, Easing.inOut(Easing.cubic)), 0) + kAt(t);
const stateColor = (k: number) => {
  const i = Math.floor(k);
  return mixHex(STATES[((i % 4) + 4) % 4].color, STATES[(((i + 1) % 4) + 4) % 4].color, k - i);
};

const arcPath = (a: number, z: number, r: number) => {
  const p = (ang: number) => `${(W.x + r * Math.cos(ang)).toFixed(2)},${(W.y + r * Math.sin(ang)).toFixed(2)}`;
  return `M${p(a)}A${r},${r} 0 0 1 ${p(z)}`;
};

// the spring: released at 68.2 s, it writes its own height as a wave
const SPRING_AT = 68.2;
const SPRING_TOP = 200;
const OMEGA = TAU / 2.4;
const springY = (tt: number) => 520 - 130 * ramp(tt, SPRING_AT - 0.2, SPRING_AT + 0.6) * Math.sin(OMEGA * Math.max(0, tt - SPRING_AT));

export const Ch5SineCosine: React.FC = () => {
  const t = useT();
  const uid = useUid();

  // ---------------------------------------------------------------- act 1
  const act1 = span(t, 4.8, 25.6, 0.6, 0.6);
  const axes1 = ramp(t, 4.8, 5.8);
  const sinDraw = ramp(t, 5.6, 7.8);
  const xp = sweepAt(t);
  const traceTo = t < 15.2 ? xp : TAU;
  const tanOn = span(t, 9.8, 25.0, 0.5, 0.5);
  const pulse = Math.sin(Math.PI * ramp(t, 15.4, 16.6));
  const oneOn = span(t, 21.0, 25.0, 0.5, 0.5);

  // ---------------------------------------------------------------- act 2
  const act2 = span(t, 25.6, 52.2, 0.7, 0.6);
  const circleDraw = ramp(t, 25.8, 27.4, Easing.inOut(Easing.cubic));
  const graphOn = span(t, 26.2, 46.4, 0.6, 0.6);
  const th = thetaAt(t);
  const thm = th >= TAU ? th - TAU : th;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const Pp = onCircle(th);
  const pointOn = ramp(t, 27.2, 27.6);
  const segOn = ramp(t, 30.6, 31.1);
  const acrossOn = ramp(t, 32.3, 32.8);
  const labelsOn = (1 - ramp(t, 35.8, 36.2)) + ramp(t, 40.4, 40.8);
  const velOn = ramp(t, 35.6, 36.2, Easing.out(Easing.cubic));
  const triOn = ramp(t, 40.8, 41.3) * (1 - ramp(t, 51.4, 52.0));
  const turn = ramp(t, 41.4, 43.6, Easing.inOut(Easing.cubic));
  const ghostOn = ramp(t, 41.2, 41.5) * (1 - ramp(t, 44.0, 44.8));
  const legsOn = ramp(t, 43.4, 44.0);
  const ghost = [
    [0, 0],
    [c, 0],
    [c, s],
  ].map(([X, Y]) => {
    const ang = (turn * Math.PI) / 2;
    const rx = X * Math.cos(ang) - Y * Math.sin(ang) + turn * c;
    const ry = X * Math.sin(ang) + Y * Math.cos(ang) + turn * s;
    return toScreen(rx, ry);
  });
  const tip = toScreen(c - s, s + c);
  const corner = toScreen(c, s + c);

  // ---------------------------------------------------------------- act 3
  const act3 = span(t, 52.0, 72.9, 0.6, 0.6);
  const wheelDraw = ramp(t, 52.0, 53.0, Easing.inOut(Easing.cubic));
  const k = kAt(t);
  const halo = haloAt(t);
  const graph3 = span(t, 52.4, 67.9, 0.6, 0.5);
  const minusOn = ramp(t, 63.0, 63.6);
  const springOn = span(t, 67.8, 72.9, 0.6, 0.6);
  const massY = springY(t);

  const recorder = (() => {
    let d = '';
    for (let px = 1550; px >= 850; px -= 4) {
      const tt = t - (1550 - px) / 240;
      if (tt < SPRING_AT - 0.2) break;
      d += `${d ? 'L' : 'M'}${px},${springY(tt).toFixed(2)}`;
    }
    return d;
  })();

  const springPath = (() => {
    const top = SPRING_TOP;
    const bottom = massY - 32;
    const n = 14;
    let d = `M1610,${top}L1610,${top + 14}`;
    for (let i = 0; i < n; i++) {
      const y = top + 14 + ((bottom - top - 28) * (i + 0.5)) / n;
      d += `L${1610 + (i % 2 ? -22 : 22)},${y.toFixed(2)}`;
    }
    d += `L1610,${bottom - 14}L1610,${bottom}`;
    return d;
  })();

  return (
    <Board>
      <Soundtrack score={score} voice={voice} speech={speech as Speech[]} />
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id={`${uid}-b1`}>
            <rect x={B1.left} y={B1.top} width={B1.width} height={B1.height} />
          </clipPath>
          <radialGradient id={`${uid}-halo`}>
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* act 1: a tangent rides the wave; its slope is plotted below it */}
        {act1 > 0 ? (
          <g opacity={act1}>
            <WaveAxes b={B1} p={axes1} />
            <g clipPath={`url(#${uid}-b1)`}>
              <Draw d={curvePath(B1, Math.sin, 0, TAU)} p={sinDraw} color={C.f} width={4.5} />
              {tanOn > 0 ? <path d={curvePath(B1, Math.cos, 0, traceTo, 240)} fill="none" stroke={mixHex(C.d, '#B9F2EE', pulse)} strokeWidth={4 + 3 * pulse} strokeLinecap="round" opacity={tanOn} /> : null}
              {tanOn > 0 ? <line {...slopeLine(B1, xp, Math.sin(xp), Math.cos(xp), xp - 0.95, xp + 0.95)} stroke={C.d} strokeWidth="3.5" strokeLinecap="round" opacity={tanOn * ramp(t, 9.8, 10.4)} /> : null}
            </g>
            {oneOn > 0 ? (
              <g opacity={oneOn}>
                <line x1={sx(B1, 0)} y1={sy(B1, 0)} x2={sx(B1, 0.7)} y2={sy(B1, 0)} stroke={C.muted} strokeWidth="2.5" strokeDasharray="8 8" />
                <line x1={sx(B1, 0.7)} y1={sy(B1, 0)} x2={sx(B1, 0.7)} y2={sy(B1, 0.7)} stroke={C.muted} strokeWidth="2.5" strokeDasharray="8 8" />
              </g>
            ) : null}
            {tanOn > 0 ? (
              <g opacity={tanOn}>
                <line x1={sx(B1, xp)} y1={sy(B1, Math.sin(xp))} x2={sx(B1, xp)} y2={sy(B1, Math.cos(xp))} stroke={C.d} strokeWidth="2" strokeDasharray="5 7" opacity={0.6 * ramp(t, 10.2, 10.6)} />
                <Dot x={sx(B1, xp)} y={sy(B1, Math.cos(xp))} color={C.d} o={ramp(t, 10.2, 10.6)} />
                <Dot x={sx(B1, xp)} y={sy(B1, Math.sin(xp))} color={C.f} />
              </g>
            ) : null}
          </g>
        ) : null}

        {/* act 2: the circle and the wave it draws */}
        {act2 > 0 ? (
          <g opacity={act2}>
            <line x1={O.x - R - 40} y1={O.y} x2={O.x + R + 40} y2={O.y} stroke={C.axis} strokeWidth="2" opacity={circleDraw} />
            <line x1={O.x} y1={O.y - R - 40} x2={O.x} y2={O.y + R + 40} stroke={C.axis} strokeWidth="2" opacity={circleDraw} />
            <circle cx={O.x} cy={O.y} r={R} fill="none" stroke={C.ink} strokeWidth="2.5" opacity={0.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - circleDraw} transform={`rotate(0 ${O.x} ${O.y})`} />

            {graphOn > 0 ? (
              <g opacity={graphOn}>
                <WaveAxes b={G} p={1} />
                <path d={curvePath(G, Math.sin, 0, Math.min(th, TAU), 240)} fill="none" stroke={C.f} strokeWidth="4.5" strokeLinecap="round" opacity={pointOn} />
                {pointOn > 0 ? (
                  <>
                    <line x1={Pp.x} y1={Pp.y} x2={sx(G, thm)} y2={sy(G, s)} stroke={C.f} strokeWidth="2" strokeDasharray="6 8" opacity={0.55 * pointOn} />
                    <Dot x={sx(G, thm)} y={sy(G, s)} color={C.f} o={pointOn} />
                  </>
                ) : null}
              </g>
            ) : null}

            {pointOn > 0 ? (
              <g opacity={pointOn}>
                {/* the radius triangle, then a ghost of it turning a quarter turn onto the velocity */}
                {triOn > 0 ? <path d={`M${O.x},${O.y}L${Pp.x},${O.y}L${Pp.x},${Pp.y}Z`} fill={C.f} opacity={0.1 * triOn} /> : null}
                {ghostOn > 0 ? (
                  <path d={`M${ghost[0].x},${ghost[0].y}L${ghost[1].x},${ghost[1].y}L${ghost[2].x},${ghost[2].y}Z`} fill={C.ink} fillOpacity={0.08} stroke={C.ink} strokeWidth="2" strokeDasharray="7 7" opacity={ghostOn} />
                ) : null}
                {thm > 0.01 ? (
                  <path
                    d={`M${O.x + 46},${O.y}A46,46 0 ${thm > Math.PI ? 1 : 0} 0 ${O.x + 46 * Math.cos(thm)},${O.y - 46 * Math.sin(thm)}`}
                    fill="none"
                    stroke={C.muted}
                    strokeWidth="2"
                  />
                ) : null}
                <line x1={O.x} y1={O.y} x2={Pp.x} y2={Pp.y} stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
                <line x1={O.x} y1={O.y} x2={Pp.x} y2={O.y} stroke={C.ink} strokeWidth="4" strokeLinecap="round" opacity={acrossOn} />
                <line x1={Pp.x} y1={O.y} x2={Pp.x} y2={Pp.y} stroke={C.f} strokeWidth="5" strokeLinecap="round" opacity={segOn} />
                {legsOn > 0 ? (
                  <g opacity={legsOn * triOn}>
                    <line x1={Pp.x} y1={Pp.y} x2={corner.x} y2={corner.y} stroke={C.d} strokeWidth="5" strokeLinecap="round" />
                    <line x1={corner.x} y1={corner.y} x2={tip.x} y2={tip.y} stroke={C.a} strokeWidth="4" strokeLinecap="round" />
                  </g>
                ) : null}
                <Arrow x1={Pp.x} y1={Pp.y} x2={lerp(Pp.x, Pp.x - R * s, velOn)} y2={lerp(Pp.y, Pp.y - R * c, velOn)} color={C.d} opacity={velOn} />
                <Dot x={Pp.x} y={Pp.y} color={C.f} />
              </g>
            ) : null}
          </g>
        ) : null}

        {/* act 3: the wheel of four, and the wave it turns */}
        {act3 > 0 ? (
          <g opacity={act3}>
            <circle cx={W.x} cy={W.y} r={WR} fill="none" stroke={C.faint} strokeWidth="2.5" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - wheelDraw} />
            {[0, 1, 2, 3].map((i) => {
              const at = i < 3 ? NAMED[i + 1] : BACK;
              const p = ramp(t, at - 0.25, at + 0.35);
              if (p <= 0) return null;
              const a = stationAngle(i) + 0.34;
              const z = stationAngle(i + 1) - 0.34;
              const end = lerp(a, z, p);
              const head = {x: W.x + WR * Math.cos(end), y: W.y + WR * Math.sin(end)};
              const back = {x: W.x + WR * Math.cos(end - 0.08), y: W.y + WR * Math.sin(end - 0.08)};
              return (
                <g key={i}>
                  <path d={arcPath(a, end, WR)} fill="none" stroke={C.muted} strokeWidth="3" strokeLinecap="round" />
                  <Arrow x1={back.x} y1={back.y} x2={head.x} y2={head.y} color={C.muted} width={3} head={16} opacity={ramp(t, at, at + 0.3)} />
                </g>
              );
            })}
            {/* top ↔ bottom: two quarter turns make a minus sign */}
            {[-1, 1].map((d) => (
              <line key={d} x1={W.x} y1={W.y + d * (WR - 40)} x2={W.x} y2={W.y + d * 40} stroke={C.a} strokeWidth="2.5" strokeDasharray="8 8" opacity={span(t, 63.0, 67.6, 0.5, 0.5)} />
            ))}
            {t > NAMED[0] - 0.1 ? (
              <g opacity={ramp(t, NAMED[0], NAMED[0] + 0.4)}>
                <circle cx={atStation(halo).x} cy={atStation(halo).y} r={86} fill={`url(#${uid}-halo)`} />
                <circle cx={atStation(halo).x} cy={atStation(halo).y} r={58} fill="none" stroke={stateColor(halo)} strokeWidth="3" />
              </g>
            ) : null}

            {graph3 > 0 ? (
              <g opacity={graph3}>
                <WaveAxes b={G3} p={1} />
                <path d={curvePath(G3, Math.sin, 0, TAU, 200)} fill="none" stroke={C.f} strokeWidth="2" strokeDasharray="4 9" opacity={0.45 * ramp(t, 57.2, 57.8)} />
                <path d={curvePath(G3, (x) => -Math.sin(x), 0, TAU, 200)} fill="none" stroke={C.a} strokeWidth="4" strokeDasharray="10 9" opacity={minusOn} />
                <Draw d={curvePath(G3, (x) => Math.sin(x + (k * Math.PI) / 2), 0, TAU, 240)} p={ramp(t, 52.6, 53.6)} color={stateColor(k)} width={4.5} />
              </g>
            ) : null}

            {springOn > 0 ? (
              <g opacity={springOn}>
                <line x1={850} y1={520} x2={1550} y2={520} stroke={C.axis} strokeWidth="2" />
                <line x1={1530} y1={SPRING_TOP} x2={1690} y2={SPRING_TOP} stroke={C.axis} strokeWidth="4" strokeLinecap="round" />
                <path d={springPath} fill="none" stroke={C.ink} strokeWidth="3" strokeLinejoin="round" opacity={0.85} />
                <rect x={1562} y={massY - 32} width={96} height={64} rx={12} fill={C.f} />
                <line x1={1550} y1={massY} x2={1562} y2={massY} stroke={C.f} strokeWidth="3" />
                {recorder ? <path d={recorder} fill="none" stroke={C.f} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}
                <circle cx={1550} cy={massY} r={7} fill={C.f} />
              </g>
            ) : null}
          </g>
        ) : null}
      </svg>

      {/* ---------------------------------------------------------- act 1 text */}
      <div style={{opacity: act1}}>
        <PiLabels b={B1} p={axes1} />
        <Place x={sx(B1, 1.95)} y={sy(B1, 1.24)} ax={0}>
          <Reveal t={t} at={7.0} until={25.0}>
            <Tex tex="\sin x" size={38} color={C.f} />
          </Reveal>
        </Place>
        <Place x={sx(B1, 0.3)} y={sy(B1, 1.24)} ax={0}>
          <Reveal t={t} at={15.6} until={25.0}>
            <Tex tex="\cos x" size={38} color={C.d} />
          </Reveal>
        </Place>
        <Place x={sx(B1, 0.06)} y={sy(B1, -0.2)} ax={0}>
          <Reveal t={t} at={21.2} until={25.0}>
            <span style={{fontFamily: SANS, fontSize: 26, color: C.d}}>slope 1</span>
          </Reveal>
        </Place>
      </div>
      <Place x={1270} y={250} ax={0}>
        <Reveal t={t} at={5.4} until={25.0}>
          <Tex tex="f(x) = \sin x" size={44} color={C.f} />
        </Reveal>
      </Place>
      {t > 10 ? (
        <Place x={1270} y={370} ax={0} style={{opacity: span(t, 10.2, 19.8, 0.5, 0.5), display: 'flex', gap: 56}}>
          <Readout label="x" value={fmt(xp, 2)} size={48} />
          <Readout label="slope of the tangent" value={fmt(Math.cos(xp), 2)} size={48} color={C.d} />
        </Place>
      ) : null}
      <Place x={1270} y={500} ax={0}>
        <Reveal t={t} at={15.8} until={25.0}>
          <Tex tex="f'(x) = \textcolor{#5CC8C2}{\cos x}" size={52} />
        </Reveal>
      </Place>
      <Place x={1270} y={620} ax={0}>
        <Reveal t={t} at={20.6} until={25.0}>
          <Mono size={15}>Chapter 4 · the limit</Mono>
        </Reveal>
      </Place>
      <Place x={1270} y={690} ax={0}>
        <Reveal t={t} at={21.0} until={25.0}>
          <Tex tex="f'(0) = \lim_{h \to 0} \frac{\sin h}{h} = \textcolor{#5CC8C2}{1}" size={38} />
        </Reveal>
      </Place>

      {/* ---------------------------------------------------------- act 2 text */}
      <div style={{opacity: act2}}>
        <PiLabels b={G} p={graphOn} />
        <Place x={O.x + 58 * Math.cos(thm / 2)} y={O.y - 58 * Math.sin(thm / 2)} ax={0} style={{opacity: pointOn * Math.min(1, labelsOn) * (thm > 0.25 ? 1 : 0)}}>
          <Tex tex="\theta" size={28} color={C.muted} />
        </Place>
        <Place x={Pp.x + 16} y={(Pp.y + O.y) / 2} ax={0} style={{opacity: segOn * Math.min(1, labelsOn) * (1 - triOn)}}>
          <Tex tex="\sin\theta" size={32} color={C.f} />
        </Place>
        <Place x={(O.x + Pp.x) / 2} y={O.y + 30} ax={0.5} style={{opacity: acrossOn * Math.min(1, labelsOn)}}>
          <Tex tex="\cos\theta" size={32} color={C.ink} />
        </Place>
        <Place x={tip.x - 10} y={tip.y - 8} ax={1} ay={1} style={{opacity: velOn * (1 - legsOn * triOn)}}>
          <span style={{fontFamily: SANS, fontSize: 24, color: C.d}}>speed 1</span>
        </Place>
        <Place x={corner.x + 14} y={(Pp.y + corner.y) / 2} ax={0} style={{opacity: legsOn * triOn}}>
          <Tex tex="\cos\theta" size={32} color={C.d} />
        </Place>
        <Place x={(corner.x + tip.x) / 2} y={corner.y - 10} ax={0.5} ay={1} style={{opacity: legsOn * triOn}}>
          <Tex tex="-\sin\theta" size={32} color={C.a} />
        </Place>
        <Place x={sx(G, 4.0)} y={G.top - 20} ax={0}>
          <Reveal t={t} at={28.4} until={46.0}>
            <Tex tex="\text{height} = \sin\theta" size={32} color={C.f} />
          </Reveal>
        </Place>
      </div>
      <Place x={880} y={330} ax={0}>
        <Reveal t={t} at={46.4} until={51.8}>
          <Mono size={15}>how fast the height grows</Mono>
        </Reveal>
      </Place>
      <Place x={880} y={410} ax={0}>
        <Reveal t={t} at={46.6} until={51.8}>
          <Tex tex="\frac{d}{d\theta}\sin\theta = \textcolor{#5CC8C2}{\cos\theta}" size={58} />
        </Reveal>
      </Place>
      <Place x={880} y={566} ax={0}>
        <Reveal t={t} at={48.8} until={51.8}>
          <Mono size={15}>how fast the distance across grows</Mono>
        </Reveal>
      </Place>
      <Place x={880} y={650} ax={0}>
        <Reveal t={t} at={49.0} until={51.8}>
          <Tex tex="\frac{d}{d\theta}\cos\theta = \textcolor{#F07B6A}{-\sin\theta}" size={58} />
        </Reveal>
      </Place>

      {/* ---------------------------------------------------------- act 3 text */}
      <div style={{opacity: act3}}>
        {STATES.map((st, i) => {
          const at = NAMED[i];
          const pos = atStation(i);
          return (
            <Place key={i} x={pos.x} y={pos.y} ax={0.5} style={{opacity: ramp(t, at - 0.1, at + 0.3), transform: `translate(-50%, -50%) scale(${lerp(0.8, 1, ramp(t, at - 0.1, at + 0.4, Easing.out(Easing.back(2))))})`}}>
              <div style={{background: C.bg, padding: '2px 12px', borderRadius: 24}}>
                <Tex tex={st.tex} size={38} color={st.color} />
              </div>
            </Place>
          );
        })}
        {[0, 1, 2, 3].map((i) => {
          const at = i < 3 ? NAMED[i + 1] : BACK;
          const mid = (stationAngle(i) + stationAngle(i + 1)) / 2;
          return (
            <Place key={i} x={W.x + (WR + 58) * Math.cos(mid)} y={W.y + (WR + 58) * Math.sin(mid)} ax={0.5} style={{opacity: ramp(t, at, at + 0.4)}}>
              <Tex tex="\tfrac{d}{dx}" size={26} color={C.muted} />
            </Place>
          );
        })}
        <Place x={W.x} y={W.y} ax={0.5}>
          <Reveal t={t} at={57.4}>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
              <Mono size={14}>each derivative</Mono>
              <Mono size={14} color={C.ink}>a quarter turn</Mono>
            </div>
          </Reveal>
        </Place>
        <div style={{opacity: graph3}}>
          <PiLabels b={G3} p={1} />
          {[0, 1].map((j) => {
            const i = Math.floor(k) + j;
            const o = j === 0 ? 1 - (k - Math.floor(k)) : k - Math.floor(k);
            const st = STATES[i % 4];
            return o > 0.01 ? (
              <Place key={j} x={G3.left + G3.width} y={G3.top - 26} ax={1} style={{opacity: o * ramp(t, 52.8, 53.4)}}>
                <Tex tex={st.tex} size={38} color={st.color} />
              </Place>
            ) : null;
          })}
          <Place x={G3.left + G3.width / 2} y={G3.top - 26} ax={0.5} style={{opacity: span(t, 57.4, 62.2, 0.4, 0.5)}}>
            <Tex tex="\xleftarrow{\;\;\pi/2\;\;}" size={30} color={C.muted} />
          </Place>
        </div>
      </div>
      <Place x={840} y={210} ax={0}>
        <Reveal t={t} at={63.0} until={67.7}>
          <Tex tex="\frac{d^2}{dx^2}\sin x = \textcolor{#F07B6A}{-\sin x}" size={46} />
        </Reveal>
      </Place>
      <Place x={850} y={236} ax={0}>
        <Reveal t={t} at={68.4} until={72.8}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
            <Mono size={15}>a spring</Mono>
            <div style={{padding: '14px 22px', border: `1.5px solid ${C.f}`, borderRadius: 10}}>
              <Tex tex="x'' = -x" size={50} />
            </div>
          </div>
        </Reveal>
      </Place>

      <Header t={t} chapter={5} title="Sine and cosine" duration={CH5_SECONDS} />
      <Narration t={t} lines={LINES} />
      <TitleCard t={t} chapter={5} title="Sine and cosine" subtitle="Derivatives that go in circles" glyph="\circlearrowright" />
      <Recap
        t={t}
        at={72.8}
        end={CH5_SECONDS}
        statement={["Sine's slope is [[d|cosine]]. Cosine's slope is [[a|minus sine]].", 'Each derivative turns the circle a [[w|quarter turn]].']}
        tex="\frac{d}{dx}\sin x = \cos x \qquad \frac{d}{dx}\cos x = -\sin x"
        next="End of series · Calculus, visually"
      />
    </Board>
  );
};
