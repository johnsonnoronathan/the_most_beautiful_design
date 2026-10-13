import React from 'react';
import {Easing} from 'remotion';
import {MONO, SANS} from '../../../lib/fonts';
import {
  areaPath,
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
  Line,
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
} from './kit';

export const CH3_SECONDS = 70;

const TOP: Box = {left: 180, top: 150, width: 960, height: 320, x0: 0, x1: 2.3, y0: 0, y1: 5};
const BOT: Box = {left: 180, top: 580, width: 960, height: 250, x0: 0, x1: 2.3, y0: 0, y1: 3.2};
const f = (x: number) => x * x;
const A = (x: number) => (x * x * x) / 3;

const LINES: Line[] = [
  [4.8, 9.4, 'Take the curve [[f|$f(t) = t^2$]] again, and shade the area from 0 up to a movable edge, $x$.'],
  [9.4, 15.0, 'Call that area [[a|$A(x)$]]. Slide the edge right: the area grows, and $A(x)$ traces its own curve.'],
  [15.0, 20.0, 'The question that ties everything together: [[d|how fast does the area grow]]?'],
  [20.0, 25.0, 'Nudge the edge right by a tiny $dx$. The area gains a thin [[d|sliver]].'],
  [25.0, 30.0, 'The sliver is nearly a rectangle: height $f(x)$, width $dx$. So $dA \\approx f(x)\\,dx$.'],
  [30.0, 35.0, 'Divide by $dx$ and let it shrink. The corner vanishes: $\\frac{dA}{dx} = f(x)$.'],
  [35.0, 38.2, 'Check: the slope of $A$ at $x = 1.4$ is 1.96 — exactly $f(1.4)$.'],
  [38.2, 43.4, 'That is the [[w|fundamental theorem]]: the derivative of the accumulated area is the original function.'],
  [43.4, 48.0, 'Turned around: to find an area, find any $F$ whose derivative is $f$…'],
  [48.0, 52.2, '…and subtract its values at the two ends. No rectangles required.'],
  [52.2, 57.4, 'Back to chapter 2: $F(t) = t^3/3$ has derivative $t^2$, so the area is $F(2) - F(0)$.'],
  [57.4, 63.0, 'Exactly $\\tfrac{8}{3}$ — the number 256 rectangles were creeping toward, now in one line.'],
];

const xAt = (t: number) => {
  if (t < 16) return 2 * ramp(t, 9, 16, Easing.inOut(Easing.sin));
  if (t < 20) return 2;
  return lerp(2, 1.4, ramp(t, 20, 21.5));
};

const dxAt = (t: number) => {
  if (t < 22) return 0;
  if (t < 31) return 0.25 * ramp(t, 22, 23);
  return lerp(0.25, 0.04, ramp(t, 31, 34));
};

const leftSum256 = (() => {
  const n = 256;
  const dx = 2 / n;
  return (dx ** 3 * (n - 1) * n * (2 * n - 1)) / 6;
})();

/** Like Reveal, but keeps its layout box while hidden so rows do not shift. */
const Hold: React.FC<{t: number; at: number; until: number; children: React.ReactNode}> = ({t, at, until, children}) => {
  const p = ramp(t, at, at + 0.8, Easing.out(Easing.cubic));
  const o = 1 - ramp(t, until - 0.45, until, Easing.in(Easing.quad));
  return <div style={{clipPath: `inset(-60px ${(1 - p) * 100}% -60px -60px)`, opacity: Math.min(1, p * 2.5) * o}}>{children}</div>;
};

export const Ch3Fundamental: React.FC = () => {
  const t = useT();

  const axesTop = ramp(t, 4.8, 5.8);
  const curve = ramp(t, 5.8, 7.0);
  const axesBot = ramp(t, 7.6, 8.6);
  const x = xAt(t);
  const dx = dxAt(t);
  const markerO = span(t, 8.4, 38.4, 0.5, 0.5);
  const sliverO = span(t, 22, 38.4, 0.4, 0.5);
  const traceEnd = t < 16 ? x : 2;
  const tangentO = span(t, 35.0, 38.4, 0.5, 0.4);
  const dim = 1 - 0.9 * span(t, 38.0, 63.4, 0.7, 0.7);

  // the sliver: a rectangle of height f(x) plus the small curved corner above it
  let corner = '';
  if (dx > 0) {
    corner = `M${sx(TOP, x)},${sy(TOP, f(x))}`;
    for (let j = 0; j <= 12; j++) {
      const u = x + (dx * j) / 12;
      corner += `L${sx(TOP, u)},${sy(TOP, f(u))}`;
    }
    corner += `L${sx(TOP, x + dx)},${sy(TOP, f(x))}Z`;
  }

  const tan = slopeLine(BOT, 1.4, A(1.4), f(1.4), 0.9, 1.9);

  return (
    <Board>
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        <g opacity={dim}>
          <Axes b={TOP} p={axesTop} xTicks={[0.5, 1, 1.5, 2]} yTicks={[1, 2, 3, 4]} xLabel="t" yLabel="f(t)" tickFmt={(n) => (n % 1 === 0 ? String(n) : n.toFixed(1))} />
          <Axes b={BOT} p={axesBot} xTicks={[0.5, 1, 1.5, 2]} yTicks={[1, 2, 3]} xLabel="x" yLabel="A(x): the area so far" tickFmt={(n) => (n % 1 === 0 ? String(n) : n.toFixed(1))} />

          {markerO > 0 ? <path d={areaPath(TOP, f, 0, x)} fill={C.a} fillOpacity={0.5} opacity={markerO} /> : null}
          {sliverO > 0 && dx > 0 ? (
            <g opacity={sliverO}>
              <rect x={sx(TOP, x)} y={sy(TOP, f(x))} width={sx(TOP, x + dx) - sx(TOP, x)} height={sy(TOP, 0) - sy(TOP, f(x))} fill={C.d} fillOpacity={0.8} />
              <path d={corner} fill={C.f} fillOpacity={0.9} />
            </g>
          ) : null}
          <Draw d={curvePath(TOP, f, 0, 2.2)} p={curve} color={C.f} width={4.5} />

          {markerO > 0 ? (
            <g opacity={markerO}>
              <line x1={sx(TOP, x)} y1={sy(TOP, 0)} x2={sx(TOP, x)} y2={sy(TOP, f(x))} stroke={C.a} strokeWidth="3" />
              <line x1={sx(TOP, x)} y1={sy(TOP, 0)} x2={sx(BOT, x)} y2={sy(BOT, A(x))} stroke={C.muted} strokeWidth="1.5" strokeDasharray="5 8" opacity={0.6} />
            </g>
          ) : null}

          <Draw d={curvePath(BOT, A, 0, traceEnd)} p={axesBot > 0 ? 1 : 0} color={C.a} width={4} opacity={axesBot} />
          {tangentO > 0 ? <line {...tan} stroke={C.d} strokeWidth="3.5" opacity={tangentO} strokeLinecap="round" /> : null}
          <Dot x={sx(BOT, x)} y={sy(BOT, A(x))} color={C.a} o={markerO} />
        </g>

        {/* magnified sliver */}
        {t > 24.6 && t < 38.6 ? (
          <g opacity={span(t, 25.0, 38.4, 0.6, 0.5)}>
            <line x1={1300} y1={610} x2={1720} y2={610} stroke={C.axis} strokeWidth="2" />
            <path d="M1330,486 Q1390,466 1440,452" fill="none" stroke={C.f} strokeWidth="3" strokeDasharray="6 8" opacity={0.6} />
            <rect x={1440} y={452} width={120} height={158} fill={C.d} fillOpacity={0.8} />
            <path d="M1440,452 Q1500,438 1560,418 L1560,452 Z" fill={C.f} fillOpacity={0.95} />
            <path d="M1560,418 Q1610,402 1660,382" fill="none" stroke={C.f} strokeWidth="3" strokeDasharray="6 8" opacity={0.6} />
            <path d="M1440,452 Q1500,438 1560,418" fill="none" stroke={C.f} strokeWidth="3.5" />
          </g>
        ) : null}
      </svg>

      <div style={{opacity: dim}}>
        <Place x={sx(TOP, 0.35)} y={sy(TOP, 4.2)} ax={0}>
          <Reveal t={t} at={6.8}>
            <Tex tex="f(t) = t^2" size={38} color={C.f} />
          </Reveal>
        </Place>
        <Place x={sx(BOT, 0.35)} y={sy(BOT, 2.4)} ax={0}>
          <Reveal t={t} at={9.6}>
            <Tex tex="A(x)" size={38} color={C.a} />
          </Reveal>
        </Place>
        {markerO > 0 ? (
          <Place x={sx(TOP, x)} y={sy(TOP, 0) + 66} ax={0.5} style={{opacity: markerO}}>
            <Tex tex="x" size={32} color={C.a} />
          </Place>
        ) : null}
        <Place x={sx(BOT, 1.9) + 14} y={tan.y2} ax={0}>
          <Reveal t={t} at={35.4} until={38.4}>
            <span style={{fontFamily: MONO, fontSize: 22, color: C.d}}>slope 1.96 = f(1.4)</span>
          </Reveal>
        </Place>
      </div>

      {/* right panel */}
      <Place x={1300} y={220} ax={0}>
        <Reveal t={t} at={7.0} until={38.2}>
          <Tex tex="A(x) = \int_0^x f(t)\,dt" size={40} />
        </Reveal>
      </Place>
      {t > 8.4 && t < 38.6 ? (
        <Place x={1300} y={340} ax={0} style={{opacity: span(t, 8.6, 38.2, 0.5, 0.5), display: 'flex', gap: 56}}>
          <Readout label="edge x" value={fmt(x, 2)} size={44} />
          <Readout label="area A(x)" value={fmt(A(x), 3)} size={44} color={C.a} />
        </Place>
      ) : null}

      <Place x={1500} y={648} ax={0.5}>
        <Reveal t={t} at={25.6} until={38.2}>
          <Tex tex="dx" size={34} color={C.d} />
        </Reveal>
      </Place>
      <Place x={1426} y={531} ax={1}>
        <Reveal t={t} at={25.8} until={38.2}>
          <Tex tex="f(x)" size={34} color={C.ink} />
        </Reveal>
      </Place>
      <Place x={1576} y={432} ax={0}>
        <Reveal t={t} at={26.4} until={38.2}>
          <span style={{fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', color: C.f}}>CORNER · SHRINKS LIKE dx²</span>
        </Reveal>
      </Place>

      <Place x={1300} y={720} ax={0}>
        <Reveal t={t} at={28.0} until={38.2}>
          <Tex tex="dA \approx f(x)\,dx" size={40} />
        </Reveal>
      </Place>
      <Place x={1300} y={820} ax={0}>
        <Reveal t={t} at={30.4} until={33.2}>
          <Tex tex="\frac{dA}{dx} \approx f(x)" size={40} />
        </Reveal>
      </Place>
      <Place x={1300} y={820} ax={0}>
        <Reveal t={t} at={33.2} until={38.2}>
          <Tex tex="\boxed{\frac{dA}{dx} = f(x)}" size={40} color={C.d} />
        </Reveal>
      </Place>

      {/* the theorem */}
      <Place x={960} y={310} ax={0.5}>
        <Reveal t={t} at={38.6} until={52.2}>
          <Tex tex="\frac{d}{dx}\int_0^x f(t)\,dt = f(x)" size={68} />
        </Reveal>
      </Place>
      <Place x={960} y={460} ax={0.5}>
        <Reveal t={t} at={40.6} until={52.2}>
          <Mono size={18} color={C.d} style={{letterSpacing: '0.36em'}}>
            Differentiation undoes integration
          </Mono>
        </Reveal>
      </Place>
      <Place x={960} y={640} ax={0.5}>
        <Reveal t={t} at={43.6} until={52.2}>
          <Tex tex="\int_a^b f(x)\,dx = F(b) - F(a)" size={68} />
        </Reveal>
      </Place>
      <Place x={960} y={760} ax={0.5}>
        <Reveal t={t} at={45.2} until={52.2}>
          <Tex tex="\text{for any } F \text{ with } F' = f" size={34} color={C.muted} />
        </Reveal>
      </Place>

      {/* one line instead of 256 rectangles */}
      <Place x={960} y={380} ax={0.5}>
        <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
          {(
            [
              ['\\int_0^2 t^2\\,dt', 52.6],
              ['= \\left[\\frac{t^3}{3}\\right]_0^2', 54.0],
              ['= \\frac{8}{3} - 0', 55.4],
              ['= \\boxed{\\textcolor{#F07B6A}{\\frac{8}{3}}}', 56.8],
            ] as [string, number][]
          ).map(([tex, at]) => (
            <Hold key={at} t={t} at={at} until={63.2}>
              <Tex tex={tex} size={64} />
            </Hold>
          ))}
        </div>
      </Place>
      <Place x={960} y={600} ax={0.5}>
        <div style={{display: 'grid', gridTemplateColumns: 'auto auto', columnGap: 64, rowGap: 18, alignItems: 'baseline'}}>
          <Hold t={t} at={58.0} until={63.2}>
            <span style={{fontFamily: SANS, fontWeight: 300, fontSize: 30, color: C.muted}}>Chapter 2 · 256 rectangles</span>
          </Hold>
          <Hold t={t} at={58.2} until={63.2}>
            <span style={{fontFamily: MONO, fontSize: 34, color: C.muted}}>{fmt(leftSum256, 4)}…</span>
          </Hold>
          <Hold t={t} at={59.0} until={63.2}>
            <span style={{fontFamily: SANS, fontWeight: 300, fontSize: 30, color: C.ink}}>Chapter 3 · one antiderivative</span>
          </Hold>
          <Hold t={t} at={59.2} until={63.2}>
            <span style={{fontFamily: MONO, fontSize: 34, color: C.a}}>2.6667 = 8/3</span>
          </Hold>
        </div>
      </Place>

      <Header t={t} chapter={3} title="The fundamental theorem" duration={CH3_SECONDS} />
      <Narration t={t} lines={LINES} />
      <TitleCard t={t} chapter={3} title="The fundamental theorem" subtitle="Two ideas, one theorem" glyph="\rightleftarrows" />
      <Recap
        t={t}
        at={63.2}
        end={CH3_SECONDS}
        statement={['Derivatives measure how fast things [[d|change]]. Integrals [[a|add change up]].', 'The fundamental theorem says each one undoes the other.']}
        tex="\frac{d}{dx}\int_0^x f(t)\,dt = f(x) \qquad \int_a^b F'(x)\,dx = F(b) - F(a)"
        next="End of series · Calculus, visually"
      />
    </Board>
  );
};
