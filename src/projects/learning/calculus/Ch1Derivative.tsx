import React from 'react';
import {Easing} from 'remotion';
import {MONO, SANS} from '../../../lib/fonts';
import {
  Axes,
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
import script from './voice/ch01.json';
import speech from './voice/ch01.timing.json';

export const CH1_SECONDS = 68;

const B: Box = {left: 180, top: 170, width: 960, height: 620, x0: 0, x1: 3.3, y0: 0, y1: 10};
const s = (t: number) => t * t;

const LINES = captions(script as VoiceScript);

const ROWS = [1, 0.5, 0.1, 0.01, 0.001];

// h shrinks geometrically from 2 to 0.001 between 26 s and 37 s.
const hAt = (t: number) => 2 * Math.pow(10, -3.3 * ramp(t, 26, 37, Easing.inOut(Easing.sin)));

// Where the tangent sits in the last act: back to 0, then sweep across.
const tangentAt = (t: number) => (t < 54.6 ? lerp(1, 0.02, ramp(t, 53, 54.5)) : lerp(0.02, 3.0, ramp(t, 55, 61.5, Easing.inOut(Easing.sin))));

export const Ch1Derivative: React.FC = () => {
  const t = useT();
  const uid = useUid();

  const axes = ramp(t, 4.8, 5.8);
  const curve = ramp(t, 5.8, 7.6);
  const plotDim = 1 - 0.92 * span(t, 40.0, 52.3, 0.8, 0.8);

  // the car's journey, then back to t = 1
  const tc = t < 12.2 ? 3 * ramp(t, 8.0, 12.0, (x) => x) : lerp(3, 1, ramp(t, 12.3, 13.4));
  const carOn = span(t, 7.8, 15.6, 0.4, 0.5);

  // secant act
  const secantOn = span(t, 15.5, 40.4, 0.6, 0.6);
  const h = t < 25.5 ? 2 : hAt(t);
  const qx = 1 + h;
  const m = (s(qx) - s(1)) / h;
  const toTangent = ramp(t, 35, 38);
  const secant = slopeLine(B, 1, 1, m, -0.4, 3.6);
  const secantDraw = ramp(t, 16, 17.2);
  const riseRun = ramp(t, 17.5, 18.5) * (1 - ramp(t, 34, 36));

  // derivative act
  const tp = tangentAt(t);
  const tanOn = span(t, 52.8, 63.4, 0.6, 0.6);
  const tanLine = slopeLine(B, tp, s(tp), 2 * tp, tp - 0.85, tp + 0.85);
  const traceTo = t < 55 ? 0 : tp;

  return (
    <Board>
      <Soundtrack chapter={1} speech={speech as Speech[]} />
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id={`${uid}-plot`}>
            <rect x={B.left} y={B.top - 30} width={B.width + 30} height={B.height + 30} />
          </clipPath>
        </defs>
        <g opacity={plotDim}>
          <Axes b={B} p={axes} xTicks={[1, 2, 3]} yTicks={[2, 4, 6, 8]} xLabel="time t (s)" yLabel="distance s (m)" />
          <g clipPath={`url(#${uid}-plot)`}>
            <Draw d={curvePath(B, s, 0, 3.15)} p={curve} color={C.f} width={4.5} />

            {/* derivative trace */}
            <Draw d={curvePath(B, (x) => 2 * x, 0, traceTo)} p={tanOn > 0 ? 1 : 0} color={C.d} width={4} opacity={tanOn} />

            {/* secant → tangent */}
            {secantOn > 0 ? (
              <line
                x1={secant.x1}
                y1={secant.y1}
                x2={lerp(secant.x1, secant.x2, secantDraw)}
                y2={lerp(secant.y1, secant.y2, secantDraw)}
                stroke={mixHex('#D8D2C8', C.d, toTangent)}
                strokeWidth={3 + toTangent}
                opacity={secantOn}
                strokeLinecap="round"
              />
            ) : null}

            {/* tangent sweeping along the curve */}
            {tanOn > 0 ? <line {...tanLine} stroke={C.d} strokeWidth="3.5" opacity={tanOn} strokeLinecap="round" /> : null}
          </g>

          {/* run and rise */}
          {riseRun > 0 && secantOn > 0 ? (
            <g opacity={riseRun * secantOn}>
              <line x1={sx(B, 1)} y1={sy(B, 1)} x2={sx(B, qx)} y2={sy(B, 1)} stroke={C.muted} strokeWidth="2.5" strokeDasharray="8 8" />
              <line x1={sx(B, qx)} y1={sy(B, 1)} x2={sx(B, qx)} y2={sy(B, s(qx))} stroke={C.muted} strokeWidth="2.5" strokeDasharray="8 8" />
            </g>
          ) : null}

          {tanOn > 0 ? (
            <g opacity={tanOn}>
              <line x1={sx(B, tp)} y1={sy(B, s(tp))} x2={sx(B, tp)} y2={sy(B, 2 * tp)} stroke={C.d} strokeWidth="2" strokeDasharray="5 7" opacity={0.6} />
              <Dot x={sx(B, tp)} y={sy(B, 2 * tp)} color={C.d} o={t > 55 ? 1 : 0} />
              <Dot x={sx(B, tp)} y={sy(B, s(tp))} color={C.f} />
            </g>
          ) : null}

          <Dot x={sx(B, tc)} y={sy(B, s(tc))} color={C.f} o={carOn} pulse={t > 13.4 && t < 15 ? (Math.sin((t - 13.4) * 6) + 1) / 2 : 0} />
          <Dot x={sx(B, 1)} y={sy(B, 1)} color={C.ink} o={secantOn} pulse={toTangent > 0.98 ? (Math.sin(t * 5) + 1) / 2 : 0} />
          <Dot x={sx(B, qx)} y={sy(B, s(qx))} color={C.ink} o={secantOn * (1 - ramp(t, 36.5, 37.5))} />
        </g>

        {/* the road */}
        {carOn > 0 ? (
          <g opacity={carOn}>
            <line x1={1270} y1={330} x2={1790} y2={330} stroke={C.axis} strokeWidth="2.5" />
            {[0, 3, 6, 9].map((v) => (
              <g key={v}>
                <line x1={1270 + v * 57.8} y1={330} x2={1270 + v * 57.8} y2={342} stroke={C.axis} strokeWidth="2" />
                <text x={1270 + v * 57.8} y={370} textAnchor="middle" fill={C.muted} style={{fontFamily: MONO, fontSize: 18}}>
                  {v} m
                </text>
              </g>
            ))}
            <g transform={`translate(${1270 + s(tc) * 57.8} 330)`}>
              <rect x={-52} y={-30} width={52} height={20} rx={7} fill={C.f} />
              <rect x={-40} y={-42} width={28} height={14} rx={5} fill={C.f} opacity={0.75} />
              <circle cx={-40} cy={-8} r={7} fill={C.ink} />
              <circle cx={-12} cy={-8} r={7} fill={C.ink} />
            </g>
          </g>
        ) : null}
      </svg>

      <div style={{opacity: plotDim}}>
        <Place x={sx(B, 1.9)} y={sy(B, 7.6)} ax={0}>
          <Reveal t={t} at={7.2}>
            <Tex tex="s(t) = t^2" size={40} color={C.f} />
          </Reveal>
        </Place>

        {/* Δt / Δs labels, then h */}
        <Place x={sx(B, 2)} y={sy(B, 1) + 36} ax={0.5}>
          <Reveal t={t} at={18.4} until={25.4}>
            <Tex tex="\Delta t = 2" size={34} color={C.ink} />
          </Reveal>
        </Place>
        <Place x={sx(B, 3) + 18} y={sy(B, 5)} ax={0}>
          <Reveal t={t} at={18.6} until={25.4}>
            <Tex tex="\Delta s = 8" size={34} color={C.ink} />
          </Reveal>
        </Place>
        {t > 25.5 && h > 0.12 ? (
          <Place x={sx(B, 1 + h / 2)} y={sy(B, 1) + 34} ax={0.5} style={{opacity: span(t, 25.6, 34, 0.5, 1.2)}}>
            <Tex tex="h" size={34} color={C.ink} />
          </Place>
        ) : null}
        <Place x={sx(B, 2.05)} y={sy(B, 2.6)} ax={0}>
          <Reveal t={t} at={37.6} until={40.4}>
            <span style={{fontFamily: SANS, fontSize: 28, fontWeight: 400, color: C.d}}>tangent line</span>
          </Reveal>
        </Place>
        <Place x={1062} y={sy(B, 6) + 34} ax={0}>
          <Reveal t={t} at={61.4} until={63.4}>
            <Tex tex="s'(t) = 2t" size={38} color={C.d} />
          </Reveal>
        </Place>
      </div>

      {/* right panel */}
      <Place x={1270} y={250} ax={0}>
        <Reveal t={t} at={8.2} until={15.6}>
          <Mono size={14}>The road · distance s(t)</Mono>
        </Reveal>
      </Place>
      {carOn > 0 ? (
        <Place x={1270} y={450} ax={0} style={{opacity: carOn, display: 'flex', gap: 56}}>
          <Readout label="time t" value={`${fmt(tc, 2)} s`} />
          <Readout label="distance s" value={`${fmt(s(tc), 2)} m`} color={C.f} />
        </Place>
      ) : null}
      <Place x={1270} y={620} ax={0}>
        <Reveal t={t} at={13.4} until={15.6}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
            <Mono size={14}>speedometer at t = 1 s</Mono>
            <span style={{fontFamily: SANS, fontWeight: 200, fontSize: 92, color: C.ink}}>? m/s</span>
          </div>
        </Reveal>
      </Place>

      <Place x={1270} y={330} ax={0}>
        <Reveal t={t} at={20.4} until={25.4}>
          <Tex tex="\text{average speed} = \dfrac{\Delta s}{\Delta t}" size={40} />
        </Reveal>
      </Place>
      <Place x={1270} y={450} ax={0}>
        <Reveal t={t} at={21.6} until={25.4}>
          <Tex tex="= \dfrac{8\ \text{m}}{2\ \text{s}} = 4\ \text{m/s}" size={40} />
        </Reveal>
      </Place>

      <Place x={1270} y={250} ax={0}>
        <Reveal t={t} at={25.8} until={40.2}>
          <Tex tex="\dfrac{\Delta s}{\Delta t} = \dfrac{s(1+h) - s(1)}{h}" size={38} />
        </Reveal>
      </Place>
      {t > 26 ? (
        <Place x={1270} y={390} ax={0} style={{opacity: span(t, 26.2, 40.2, 0.5, 0.5), display: 'flex', gap: 56}}>
          <Readout label="h" value={fmt(h, 3)} size={52} />
          <Readout label="slope" value={fmt(m, 3)} size={52} color={mixHex(C.ink, C.d, toTangent)} />
        </Place>
      ) : null}
      {t > 26 ? (
        <div style={{position: 'absolute', left: 1270, top: 500, width: 420, opacity: span(t, 26.2, 40.2, 0.5, 0.5)}}>
          <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.faint}`, paddingBottom: 10}}>
            <Mono size={14}>h</Mono>
            <Mono size={14}>slope</Mono>
          </div>
          {ROWS.map((r) =>
            h <= r * 1.0001 + 1e-9 ? (
              <div key={r} style={{display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 26, color: C.ink, padding: '8px 0', borderBottom: `1px solid ${C.faint}`, fontVariantNumeric: 'tabular-nums'}}>
                <span>{fmt(r, 3)}</span>
                <span style={{color: r < 0.05 ? C.d : C.ink}}>{fmt(2 + r, 3)}</span>
              </div>
            ) : null,
          )}
        </div>
      ) : null}

      {/* algebra */}
      {(
        [
          [
            ['\\frac{s(1+h) - s(1)}{h}', 40.6],
            ['= \\frac{(1+h)^2 - 1}{h}', 42.0],
          ],
          [['= \\frac{\\cancel{1} + 2h + h^2 - \\cancel{1}}{h}', 43.8]],
          [['= \\frac{2h + h^2}{h} = 2 + h', 45.8]],
          [['\\xrightarrow{\\; h\\ \\to\\ 0 \\;}\\quad \\boxed{\\textcolor{#5CC8C2}{2\\ \\text{m/s}}}', 48.4]],
        ] as [string, number][][]
      ).map((row, i) => (
        <Place key={i} x={i === 0 ? 296 : 742} y={235 + i * 180} ax={0}>
          <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
            {row.map(([tex, at]) => (
              <Reveal key={at} t={t} at={at} until={52.4}>
                <Tex tex={tex} size={52} />
              </Reveal>
            ))}
          </div>
        </Place>
      ))}

      {/* the derivative, defined */}
      <Place x={1270} y={250} ax={0}>
        <Reveal t={t} at={52.6} until={63.4}>
          <Tex tex="s'(t) = \lim_{h \to 0} \dfrac{s(t+h) - s(t)}{h}" size={36} color={C.ink} />
        </Reveal>
      </Place>
      {t > 53 ? (
        <Place x={1270} y={400} ax={0} style={{opacity: span(t, 53.2, 63.4, 0.5, 0.5), display: 'flex', gap: 56}}>
          <Readout label="time t" value={fmt(tp, 2)} size={48} />
          <Readout label="slope of tangent" value={fmt(2 * tp, 2)} size={48} color={C.d} />
        </Place>
      ) : null}

      <Header t={t} chapter={1} title="The derivative" duration={CH1_SECONDS} />
      <Narration t={t} lines={LINES} />
      <TitleCard t={t} chapter={1} title="The derivative" subtitle="Speed at a single instant" glyph="\tfrac{d}{dt}" />
      <Recap
        t={t}
        at={63.2}
        end={CH1_SECONDS}
        statement={['The derivative is the [[d|slope of the tangent]]:', 'rise over run, as the run shrinks to zero.']}
        tex="s'(t) = \lim_{h \to 0} \dfrac{s(t+h) - s(t)}{h}"
        next="Next · Chapter 2 · The integral"
      />
    </Board>
  );
};
