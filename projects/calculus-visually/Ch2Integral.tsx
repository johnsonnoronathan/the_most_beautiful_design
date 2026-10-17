import React from 'react';
import {Easing} from 'remotion';
import {MONO, SANS} from '../../studio/lib/fonts';
import {
  areaPath,
  Axes,
  Board,
  Box,
  C,
  curvePath,
  Draw,
  fmt,
  Header,
  lerp,
  Mono,
  Narration,
  Place,
  ramp,
  Readout,
  Recap,
  Reveal,
  Rich,
  span,
  sx,
  sy,
  Tex,
  TitleCard,
  useT,
} from './kit';
import {captions, Soundtrack, Speech, VoiceScript} from './kit';
import script from './voice/ch02.json';
import speech from './voice/ch02.timing.json';
import score from './assets/ch02-score.mp3';
import voice from './assets/ch02-voice.mp3';

export const CH2_SECONDS = 64;

const LINES = captions(script as VoiceScript);

// Slices double every few seconds; each split grows the new right-hand child up to the curve.
const LEVELS: [number, number][] = [
  [22.6, 4],
  [26.6, 8],
  [29.6, 16],
  [32.2, 32],
  [34.6, 64],
  [37.0, 128],
  [39.0, 256],
];

/** Left Riemann sum of t² on [0, 2] with n slices. */
const leftSum = (n: number) => {
  const dx = 2 / n;
  return (dx ** 3 * (n - 1) * n * (2 * n - 1)) / 6;
};

const riemann = (t: number) => {
  let k = -1;
  LEVELS.forEach(([start], i) => {
    if (t >= start) k = i;
  });
  if (k < 0) return null;
  const [start, n] = LEVELS[k];
  const dx = 2 / n;
  const tr = k === 0 ? 1 : ramp(t, start, start + 0.7);
  const heights = Array.from({length: n}, (_, i) => {
    const own = (i * dx) ** 2;
    if (k === 0) return own * ramp(t, start + i * 0.16, start + i * 0.16 + 0.55, Easing.out(Easing.cubic));
    const parent = (Math.floor(i / 2) * 2 * dx) ** 2;
    return lerp(parent, own, tr);
  });
  const sum = k === 0 ? leftSum(4) * ramp(t, start, start + 1.2) : lerp(leftSum(LEVELS[k - 1][1]), leftSum(n), tr);
  return {k, n, dx, heights, sum};
};

const SPARK = {left: 1290, top: 600, width: 380, height: 170};
const sparkX = (n: number) => SPARK.left + ((Math.log2(n) - 2) / 6) * SPARK.width;
const sparkY = (v: number) => SPARK.top + SPARK.height - ((v - 1.6) / (2.9 - 1.6)) * SPARK.height;

export const Ch2Integral: React.FC = () => {
  const t = useT();

  const morph = ramp(t, 15.6, 17.2);
  const B: Box = {left: 180, top: 170, width: 960, height: 620, x0: 0, x1: lerp(4.4, 2.3, morph), y0: 0, y1: 4.6};
  const c = ramp(t, 16.6, 18.6);
  const v = (x: number) => lerp(3, x * x, c);

  const axes = ramp(t, 4.8, 5.8);
  const curve = ramp(t, 5.8, 6.8);
  const rectW = 4 * ramp(t, 7.5, 9.5);
  const rectO = span(t, 7.4, 15.6, 0.3, 0.6);

  const R = riemann(t);
  const rectsO = span(t, 22.5, 43.6, 0.2, 1.6);
  const smoothO = ramp(t, 42.0, 43.6);

  let rects = '';
  let gaps = '';
  if (R && rectsO > 0) {
    R.heights.forEach((h, i) => {
      const a = i * R.dx;
      const z = (i + 1) * R.dx;
      rects += `M${sx(B, a)},${sy(B, 0)}V${sy(B, h)}H${sx(B, z)}V${sy(B, 0)}Z`;
      let g = `M${sx(B, a)},${sy(B, h)}`;
      for (let j = 0; j <= 6; j++) {
        const x = a + ((z - a) * j) / 6;
        g += `L${sx(B, x)},${sy(B, Math.max(h, x * x))}`;
      }
      gaps += g + `L${sx(B, z)},${sy(B, h)}Z`;
    });
  }
  const seam = R ? Math.max(0.35, 2.2 * Math.sqrt(4 / R.n)) : 2;

  const sigmaToInt = ramp(t, 45.0, 46.4);

  return (
    <Board>
      <Soundtrack score={score} voice={voice} speech={speech as Speech[]} />
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        <Axes
          b={B}
          p={axes}
          xTicks={[
            [0.5, morph],
            [1, 1],
            [1.5, morph],
            [2, 1],
            [3, 1 - morph],
            [4, 1 - morph],
          ]}
          yTicks={[1, 2, 3, 4]}
          xLabel="time t (s)"
          yLabel="speed v (m/s)"
          tickFmt={(n) => (n % 1 === 0 ? String(n) : n.toFixed(1))}
        />

        {rectO > 0 ? (
          <rect x={sx(B, 0)} y={sy(B, 3)} width={sx(B, rectW) - sx(B, 0)} height={sy(B, 0) - sy(B, 3)} fill={C.a} fillOpacity={0.45} stroke={C.a} strokeWidth="2" opacity={rectO} />
        ) : null}

        {smoothO > 0 ? <path d={areaPath(B, v, 0, 2)} fill={C.a} fillOpacity={0.5} opacity={smoothO * (1 - ramp(t, 57.2, 57.6))} /> : null}
        {rectsO > 0 ? (
          <g opacity={rectsO}>
            <path d={gaps} fill={C.f} fillOpacity={0.28} />
            <path d={rects} fill={C.a} fillOpacity={0.55} stroke={C.bg} strokeWidth={seam} />
          </g>
        ) : null}

        <Draw d={curvePath(B, v, 0, lerp(4.2, 2.12, morph))} p={curve} color={C.f} width={4.5} />

        {/* convergence chart */}
        {R && t < 42.4 ? (
          <g opacity={span(t, 26.8, 42.4, 0.5, 0.5)}>
            <line x1={SPARK.left} y1={SPARK.top + SPARK.height} x2={SPARK.left + SPARK.width} y2={SPARK.top + SPARK.height} stroke={C.axis} strokeWidth="2" />
            <line x1={SPARK.left} y1={SPARK.top} x2={SPARK.left} y2={SPARK.top + SPARK.height} stroke={C.axis} strokeWidth="2" />
            <line
              x1={SPARK.left}
              y1={sparkY(8 / 3)}
              x2={SPARK.left + SPARK.width * ramp(t, 38.2, 39.4)}
              y2={sparkY(8 / 3)}
              stroke={C.ink}
              strokeWidth="2"
              strokeDasharray="7 7"
              opacity={0.7}
            />
            {LEVELS.slice(0, R.k + 1).map(([, n], i) => {
              const val = i === R.k ? R.sum : leftSum(n);
              const prev = i > 0 ? LEVELS[i - 1][1] : null;
              return (
                <g key={n}>
                  {prev ? <line x1={sparkX(prev)} y1={sparkY(leftSum(prev))} x2={sparkX(n)} y2={sparkY(val)} stroke={C.a} strokeWidth="2.5" /> : null}
                  <circle cx={sparkX(n)} cy={sparkY(Math.max(1.6, val))} r={6} fill={C.a} />
                  <text x={sparkX(n)} y={SPARK.top + SPARK.height + 30} textAnchor="middle" fill={C.muted} style={{fontFamily: MONO, fontSize: 16}}>
                    {n}
                  </text>
                </g>
              );
            })}
          </g>
        ) : null}
      </svg>

      <Place x={sx(B, 3.15)} y={sy(B, 3.45)} ax={0}>
        <Reveal t={t} at={6.6} until={16.6}>
          <Tex tex="v(t) = 3" size={40} color={C.f} />
        </Reveal>
      </Place>
      <Place x={sx(B, 0.5)} y={sy(B, 3.7)} ax={0}>
        <Reveal t={t} at={18.4}>
          <Tex tex="v(t) = t^2" size={40} color={C.f} />
        </Reveal>
      </Place>
      <Place x={sx(B, 2)} y={sy(B, 1.5)} ax={0.5}>
        <Reveal t={t} at={10.2} until={15.4}>
          <Tex tex="3 \times 4 = 12\ \text{m}" size={44} color={C.bright} />
        </Reveal>
      </Place>
      <Place x={sx(B, 1.42)} y={sy(B, 0.7)} ax={0.5}>
        <Reveal t={t} at={53.0} until={57.4}>
          <Tex tex="\tfrac{8}{3}\ \text{m}" size={46} color={C.bright} />
        </Reveal>
      </Place>

      {/* right panel */}
      <Place x={1290} y={300} ax={0}>
        <Reveal t={t} at={10.0} until={15.4}>
          <Tex tex="\text{distance} = \text{speed} \times \text{time}" size={36} />
        </Reveal>
      </Place>
      <Place x={1290} y={390} ax={0}>
        <Reveal t={t} at={11.0} until={15.4}>
          <Tex tex="= 3\ \tfrac{\text{m}}{\text{s}} \times 4\ \text{s} = 12\ \text{m}" size={36} />
        </Reveal>
      </Place>
      <Place x={1290} y={300} ax={0}>
        <Reveal t={t} at={19.2} until={22.5}>
          <Tex tex="\text{distance} = \ ?" size={44} />
        </Reveal>
      </Place>

      <Place x={1290} y={260} ax={0}>
        <Reveal t={t} at={23.0} until={42.2}>
          <Tex tex="\sum_{i=0}^{n-1} v(t_i)\,\Delta t" size={40} />
        </Reveal>
      </Place>
      {R && t < 42.4 ? (
        <Place x={1290} y={430} ax={0} style={{opacity: span(t, 23.2, 42.4, 0.5, 0.5), display: 'flex', gap: 44}}>
          <Readout label="slices n" value={String(R.n)} size={40} />
          <Readout label="Δt" value={fmt(R.dx, 4)} size={40} />
          <Readout label="sum" value={fmt(R.sum, 4)} size={40} color={C.a} />
        </Place>
      ) : null}
      <Place x={1290} y={560} ax={0}>
        <Reveal t={t} at={27.0} until={42.2}>
          <Mono size={14}>sum vs. number of slices</Mono>
        </Reveal>
      </Place>
      <Place x={SPARK.left + SPARK.width + 18} y={sparkY(8 / 3)} ax={0}>
        <Reveal t={t} at={39.2} until={42.2}>
          <Tex tex="\tfrac{8}{3} \approx 2.667" size={28} color={C.ink} />
        </Reveal>
      </Place>

      {/* Σ becomes ∫ */}
      {t > 42.4 && t < 57.6 ? (
        <>
          <Place x={1290} y={300} ax={0} style={{opacity: span(t, 42.6, 57.4, 0.6, 0.5) * (1 - sigmaToInt), transform: `translate(0, -50%) scaleX(${1 - 0.25 * sigmaToInt})`, transformOrigin: 'left center'}}>
            <Tex tex="\sum_{i=0}^{n-1} v(t_i)\,\Delta t" size={52} />
          </Place>
          <Place
            x={1290}
            y={300}
            ax={0}
            style={{opacity: sigmaToInt * (1 - ramp(t, 57.0, 57.5)), transform: `translate(0, -50%) scale(${1.25 - 0.25 * sigmaToInt})`, transformOrigin: 'left center'}}
          >
            <Tex tex="\int_0^2 v(t)\,dt" size={52} color={C.ink} />
          </Place>
        </>
      ) : null}
      <Place x={1290} y={490} ax={0}>
        <Reveal t={t} at={47.4} until={57.4}>
          <div style={{fontFamily: SANS, fontWeight: 300, fontSize: 28, color: C.muted, lineHeight: 1.9}}>
            <div>
              <Rich text="$\int$  a stretched S, for [[w|sum]]" size={28} />
            </div>
            <div>
              <Rich text="$dt$  an infinitely thin $\Delta t$" size={28} />
            </div>
          </div>
        </Reveal>
      </Place>
      <Place x={1290} y={660} ax={0}>
        <Reveal t={t} at={50.6} until={57.4}>
          <Tex tex="= \int_0^2 t^2\,dt = \tfrac{8}{3}\ \text{m}" size={44} color={C.ink} />
        </Reveal>
      </Place>

      <Header t={t} chapter={2} title="The integral" duration={CH2_SECONDS} />
      <Narration t={t} lines={LINES} />
      <TitleCard t={t} chapter={2} title="The integral" subtitle="Adding up infinitely many slivers" glyph="\int" />
      <Recap
        t={t}
        at={57.5}
        end={CH2_SECONDS}
        statement={['The integral adds up infinitely many, infinitely thin slices.', 'Under a speed curve, that area is the [[a|distance travelled]].']}
        tex="\int_a^b f(x)\,dx = \lim_{n \to \infty} \sum_{i=0}^{n-1} f(x_i)\,\Delta x"
        next="Next · Chapter 3 · The fundamental theorem"
      />
    </Board>
  );
};
