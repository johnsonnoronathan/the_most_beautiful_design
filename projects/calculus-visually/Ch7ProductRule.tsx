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
import script from './voice/ch07.json';
import speech from './voice/ch07.timing.json';
import score from './assets/ch07-score.mp3';
import voice from './assets/ch07-voice.mp3';

export const CH7_SECONDS = 81;

const LINES = captions(script as VoiceScript);

// In this chapter f = x² is amber, g = sin x is teal, and their product, an area, is coral.
const AMBER = '#F4B860';
const TEAL = '#5CC8C2';
const CORAL = '#F07B6A';

const f = (x: number) => x * x;
const g = Math.sin;
const h = (x: number) => f(x) * g(x);
const fp = (x: number) => 2 * x;
const gp = Math.cos;
const hp = (x: number) => fp(x) * g(x) + f(x) * gp(x);
const guess = (x: number) => fp(x) * gp(x);
const X0 = 1;

const PlainAxes: React.FC<{b: Box; p: number; xTicks: number[]; yTicks: number[]}> = ({b, p, xTicks, yTicks}) => (
  <g opacity={p}>
    {xTicks.map((v) => (
      <line key={'gx' + v} x1={sx(b, v)} y1={b.top} x2={sx(b, v)} y2={b.top + b.height} stroke={C.grid} strokeWidth="1.5" />
    ))}
    {yTicks.map((v) => (
      <line key={'gy' + v} x1={b.left} y1={sy(b, v)} x2={b.left + b.width} y2={sy(b, v)} stroke={C.grid} strokeWidth="1.5" />
    ))}
    <line x1={b.left} y1={sy(b, 0)} x2={b.left + b.width} y2={sy(b, 0)} stroke={C.axis} strokeWidth="2.5" />
    <line x1={sx(b, 0)} y1={b.top} x2={sx(b, 0)} y2={b.top + b.height} stroke={C.axis} strokeWidth="2.5" />
    {xTicks.map((v) => (
      <text key={'tx' + v} x={sx(b, v)} y={b.top + b.height + 30} textAnchor="middle" fill={C.muted} style={{fontFamily: MONO, fontSize: 20}}>
        {v}
      </text>
    ))}
    {yTicks.map((v) => (
      <text key={'ty' + v} x={b.left - 14} y={sy(b, v) + 7} textAnchor="end" fill={C.muted} style={{fontFamily: MONO, fontSize: 20}}>
        {v < 0 ? `−${-v}` : v}
      </text>
    ))}
  </g>
);

// ------------------------------------------------------------------ act 1: the tempting guess

const B1: Box = {left: 180, top: 200, width: 940, height: 540, x0: -0.05, x1: 2.6, y0: -0.5, y1: 4.3};

// ------------------------------------------------------------------ act 2: the rectangle

const O = {x: 300, y: 800}; // bottom-left corner of the rectangle
const S = 430; // px per unit
const BAR = {x: 1330, scale: 200};

// the width grows, then the height; later the nudge shrinks ten-thousandfold, far enough
// that the total reads the true slope's digits (2.223)
const nudgeAt = (t: number) => (t < 43.6 ? 0.25 : 0.25 * 10 ** (-4 * ramp(t, 43.6, 46.6, Easing.inOut(Easing.sin))));

// ------------------------------------------------------------------ act 3: check on the graph

const H: Box = {left: 180, top: 170, width: 1000, height: 290, x0: -0.05, x1: 2.6, y0: -0.4, y1: 4.2};
const D: Box = {left: 180, top: 540, width: 1000, height: 290, x0: -0.05, x1: 2.6, y0: -5.5, y1: 4.5};
const sweepAt = (t: number) => (t < 63.4 ? X0 : t < 64.0 ? lerp(X0, 0, ramp(t, 63.4, 63.9)) : 2.5 * ramp(t, 64.0, 68.4, Easing.inOut(Easing.sin)));

// ------------------------------------------------------------------ act 4: a box of three factors

const ISO = {x: 560, y: 560, s: 210};
const iso = (x: number, y: number, z: number) => ({x: ISO.x + (x - y) * 0.866 * ISO.s, y: ISO.y + (x + y) * 0.5 * ISO.s - z * ISO.s});
const quad = (pts: [number, number, number][]) =>
  pts
    .map(([x, y, z], i) => {
      const p = iso(x, y, z);
      return `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join('') + 'Z';
/** The three faces of a box [x0,x1]×[y0,y1]×[z0,z1] that face the viewer (+x, +y, +z). */
const prism = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => ({
  px: quad([
    [x1, y0, z0],
    [x1, y1, z0],
    [x1, y1, z1],
    [x1, y0, z1],
  ]),
  py: quad([
    [x0, y1, z0],
    [x1, y1, z0],
    [x1, y1, z1],
    [x0, y1, z1],
  ]),
  pz: quad([
    [x0, y0, z1],
    [x1, y0, z1],
    [x1, y1, z1],
    [x0, y1, z1],
  ]),
});
const BOX = {a: 1.3, b: 1.0, c: 0.9};
const GAP = 0.16; // the slabs float just off the faces they grow from

const Prism: React.FC<{p: ReturnType<typeof prism>; color: string; o?: number}> = ({p, color, o = 1}) => (
  <g opacity={o} strokeLinejoin="round">
    <path d={p.py} fill={mixHex(color, '#0E1014', 0.45)} stroke={color} strokeWidth="1.5" strokeOpacity={0.6} />
    <path d={p.px} fill={mixHex(color, '#0E1014', 0.25)} stroke={color} strokeWidth="1.5" strokeOpacity={0.6} />
    <path d={p.pz} fill={color} stroke={color} strokeWidth="1.5" strokeOpacity={0.6} />
  </g>
);

export const Ch7ProductRule: React.FC = () => {
  const t = useT();
  const uid = useUid();

  // ---------------------------------------------------------------- act 1
  const act1 = span(t, 4.8, 20.6, 0.6, 0.6);
  const guessOn = ramp(t, 12.5, 13.1);
  const trueOn = ramp(t, 14.3, 14.9);

  // ---------------------------------------------------------------- act 2
  const act2 = span(t, 20.8, 58.2, 0.6, 0.6);
  const n = nudgeAt(t);
  const pW = ramp(t, 27.2, 28.0, Easing.out(Easing.cubic));
  const pH = ramp(t, 28.5, 29.3, Easing.out(Easing.cubic));
  const df = f(X0 + n * pW) - f(X0);
  const dg = g(X0 + n * pH) - g(X0);
  const W0 = f(X0) * S;
  const H0 = g(X0) * S;
  const dW = df * S;
  const dH = dg * S;
  const rectOn = ramp(t, 21.0, 21.6);
  const widthOn = ramp(t, 21.9, 22.6, Easing.out(Easing.cubic));
  const heightOn = ramp(t, 22.8, 23.5, Easing.out(Easing.cubic));
  const areaOn = ramp(t, 24.0, 24.8);
  const glow = (at: number) => Math.sin(Math.PI * ramp(t, at, at + 1.4));
  const sideGlow = glow(33.6);
  const topGlow = glow(36.9);
  const cornerGlow = glow(39.0);
  const pieceLabels = 1 - ramp(t, 43.6, 44.4);
  const perDx = {side: (g(X0) * df) / (n || 1), top: (f(X0) * dg) / (n || 1), corner: (df * dg) / (n || 1)};
  const barsOn = ramp(t, 43.3, 43.9);

  // ---------------------------------------------------------------- act 3
  const act3 = span(t, 58.0, 69.0, 0.6, 0.6);
  const xs = sweepAt(t);
  const traceOn = ramp(t, 64.0, 64.4);

  // ---------------------------------------------------------------- act 4
  const act4 = span(t, 69.0, 74.8, 0.6, 0.6);
  const da = 0.3 * ramp(t, 70.1, 70.9, Easing.out(Easing.cubic));
  const db = 0.3 * ramp(t, 70.5, 71.3, Easing.out(Easing.cubic));
  const dc = 0.3 * ramp(t, 70.9, 71.7, Easing.out(Easing.cubic));
  const {a, b: bb, c} = BOX;

  return (
    <Board>
      <Soundtrack score={score} voice={voice} speech={speech as Speech[]} />
      <svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id={`${uid}-b1`}>
            <rect x={B1.left} y={B1.top} width={B1.width} height={B1.height} />
          </clipPath>
          <clipPath id={`${uid}-h`}>
            <rect x={H.left} y={H.top} width={H.width} height={H.height} />
          </clipPath>
          <clipPath id={`${uid}-d`}>
            <rect x={D.left} y={D.top} width={D.width} height={D.height} />
          </clipPath>
        </defs>

        {/* act 1: x² sin x, the guess, and the real tangent */}
        {act1 > 0 ? (
          <g opacity={act1}>
            <PlainAxes b={B1} p={ramp(t, 4.8, 5.6)} xTicks={[1, 2]} yTicks={[1, 2, 3, 4]} />
            <g clipPath={`url(#${uid}-b1)`}>
              <Draw d={curvePath(B1, h, 0, 2.6, 300)} p={ramp(t, 5.4, 7.6)} color={CORAL} width={4.5} />
              <line {...slopeLine(B1, X0, h(X0), guess(X0), X0 - 0.75, X0 + 0.75)} stroke={C.muted} strokeWidth="3" strokeDasharray="10 9" strokeLinecap="round" opacity={guessOn} />
              <line {...slopeLine(B1, X0, h(X0), hp(X0), X0 - 0.45, X0 + 0.45)} stroke={C.bright} strokeWidth="3.5" strokeLinecap="round" opacity={trueOn} />
            </g>
            <Dot x={sx(B1, X0)} y={sy(B1, h(X0))} color={CORAL} o={ramp(t, 8.0, 8.4)} />
          </g>
        ) : null}

        {/* act 2: the rectangle and the area a nudge adds */}
        {act2 > 0 ? (
          <g opacity={act2}>
            <rect x={O.x} y={O.y - H0} width={W0} height={H0} fill={CORAL} opacity={0.2 * areaOn} />
            {pW > 0 && dW > 0.2 ? <rect x={O.x + W0} y={O.y - H0} width={dW} height={H0} fill={AMBER} opacity={0.78 + 0.22 * sideGlow} /> : null}
            {pH > 0 && dH > 0.2 ? <rect x={O.x} y={O.y - H0 - dH} width={W0} height={dH} fill={TEAL} opacity={0.78 + 0.22 * topGlow} /> : null}
            {pW > 0 && pH > 0 && dW > 0.2 && dH > 0.2 ? <rect x={O.x + W0} y={O.y - H0 - dH} width={dW} height={dH} fill={C.bright} opacity={0.85 + 0.15 * cornerGlow} /> : null}
            {/* outline of the grown rectangle, dashed */}
            {pW > 0 ? (
              <path
                d={`M${O.x + W0},${O.y - H0}L${O.x + W0 + dW},${O.y - H0}L${O.x + W0 + dW},${O.y}`}
                fill="none"
                stroke={AMBER}
                strokeWidth="2"
                opacity={0.8}
              />
            ) : null}
            {pH > 0 ? (
              <path d={`M${O.x},${O.y - H0}L${O.x},${O.y - H0 - dH}L${O.x + W0 + dW},${O.y - H0 - dH}L${O.x + W0 + dW},${O.y - H0}`} fill="none" stroke={TEAL} strokeWidth="2" opacity={0.8} />
            ) : null}
            {/* the original rectangle's sides */}
            <line x1={O.x} y1={O.y} x2={O.x + W0 * widthOn} y2={O.y} stroke={AMBER} strokeWidth="5" strokeLinecap="round" opacity={rectOn} />
            <line x1={O.x} y1={O.y} x2={O.x} y2={O.y - H0 * heightOn} stroke={TEAL} strokeWidth="5" strokeLinecap="round" opacity={rectOn} />
            <path d={`M${O.x},${O.y - H0}L${O.x + W0},${O.y - H0}L${O.x + W0},${O.y}`} fill="none" stroke={CORAL} strokeWidth="2.5" opacity={areaOn} />

            {/* per unit dx: what each piece adds */}
            {barsOn > 0 ? (
              <g opacity={barsOn}>
                {(
                  [
                    [perDx.side, AMBER, 380],
                    [perDx.top, TEAL, 450],
                    [perDx.corner, C.bright, 520],
                  ] as [number, string, number][]
                ).map(([v, color, y]) => (
                  <rect key={y} x={BAR.x} y={y - 14} width={Math.max(0, v * BAR.scale)} height={28} rx={4} fill={color} opacity={0.85} />
                ))}
                <line x1={BAR.x} y1={350} x2={BAR.x} y2={630} stroke={C.axis} strokeWidth="2" />
                <line x1={1130} y1={566} x2={1790} y2={566} stroke={C.faint} strokeWidth="1.5" />
              </g>
            ) : null}
          </g>
        ) : null}

        {/* act 3: h and its slope, built from the two pieces */}
        {act3 > 0 ? (
          <g opacity={act3}>
            <PlainAxes b={H} p={ramp(t, 58.0, 58.8)} xTicks={[1, 2]} yTicks={[2, 4]} />
            <g clipPath={`url(#${uid}-h)`}>
              <Draw d={curvePath(H, h, 0, 2.6, 300)} p={ramp(t, 58.2, 59.4)} color={CORAL} width={4} />
              <line {...slopeLine(H, xs, h(xs), hp(xs), xs - 0.22, xs + 0.22)} stroke={C.bright} strokeWidth="3.5" strokeLinecap="round" opacity={ramp(t, 58.6, 59.2)} />
            </g>
            <Dot x={sx(H, xs)} y={sy(H, h(xs))} color={CORAL} o={ramp(t, 58.6, 59.2)} />

            <PlainAxes b={D} p={ramp(t, 63.6, 64.2)} xTicks={[1, 2]} yTicks={[-4, 4]} />
            <g clipPath={`url(#${uid}-d)`}>
              <Draw d={curvePath(D, (x) => fp(x) * g(x), 0, 2.6, 240)} p={ramp(t, 63.8, 65.0)} color={AMBER} width={2.5} dash="9 8" />
              <Draw d={curvePath(D, (x) => f(x) * gp(x), 0, 2.6, 240)} p={ramp(t, 64.0, 65.2)} color={TEAL} width={2.5} dash="9 8" />
              <Draw d={curvePath(D, guess, 0, 2.6, 240)} p={ramp(t, 66.4, 67.4)} color={C.muted} width={2.5} dash="3 9" />
              {traceOn > 0 && xs > 0.01 ? <path d={curvePath(D, hp, 0, xs, 300)} fill="none" stroke={C.bright} strokeWidth="4" strokeLinecap="round" opacity={traceOn} /> : null}
            </g>
            {traceOn > 0 ? (
              <g opacity={traceOn}>
                <line x1={sx(H, xs)} y1={sy(H, h(xs))} x2={sx(D, xs)} y2={sy(D, hp(xs))} stroke={C.ink} strokeWidth="1.5" strokeDasharray="4 8" opacity={0.35} />
                <Dot x={sx(D, xs)} y={sy(D, hp(xs))} color={C.bright} />
              </g>
            ) : null}
          </g>
        ) : null}

        {/* act 4: three factors make a box; each factor's change adds a slab */}
        {act4 > 0 ? (
          <g opacity={act4}>
            <Prism p={prism(0, a, 0, bb, 0, c)} color="#5A6170" />
            {dc > 0.005 ? <Prism p={prism(0, a, 0, bb, c + GAP, c + GAP + dc)} color={CORAL} o={0.94} /> : null}
            {da > 0.005 ? <Prism p={prism(a + GAP, a + GAP + da, 0, bb, 0, c)} color={AMBER} o={0.94} /> : null}
            {db > 0.005 ? <Prism p={prism(0, a, bb + GAP, bb + GAP + db, 0, c)} color={TEAL} o={0.94} /> : null}
          </g>
        ) : null}
      </svg>

      {/* ------------------------------------------------------------ act 1 text */}
      <div style={{opacity: act1}}>
        <Place x={sx(B1, 0.08)} y={sy(B1, 3.9)} ax={0}>
          <Reveal t={t} at={6.6} until={20.6}>
            <Tex tex="h(x) = x^2 \sin x" size={38} color={CORAL} />
          </Reveal>
        </Place>
        <Place x={sx(B1, X0 + 0.5)} y={sy(B1, h(X0) + hp(X0) * 0.5) - 6} ax={0} ay={1}>
          <Reveal t={t} at={14.6} until={20.6}>
            <span style={{fontFamily: SANS, fontSize: 26, color: C.bright}}>true slope 2.22</span>
          </Reveal>
        </Place>
        <Place x={sx(B1, X0 + 0.76)} y={sy(B1, h(X0) + guess(X0) * 0.76) + 8} ax={0} ay={0}>
          <Reveal t={t} at={12.8} until={20.6}>
            <span style={{fontFamily: SANS, fontSize: 26, color: C.muted}}>
              guess 1.08 <span style={{color: CORAL, opacity: ramp(t, 14.9, 15.3)}}>✕</span>
            </span>
          </Reveal>
        </Place>
      </div>
      <Place x={1250} y={260} ax={0}>
        <Reveal t={t} at={5.6} until={20.6}>
          <Tex tex={`h(x) = \\textcolor{${AMBER}}{x^2} \\cdot \\textcolor{${TEAL}}{\\sin x}`} size={44} />
        </Reveal>
      </Place>
      <Place x={1250} y={370} ax={0}>
        <Reveal t={t} at={11.4} until={20.6}>
          <Mono size={15}>the tempting guess</Mono>
        </Reveal>
      </Place>
      <Place x={1250} y={430} ax={0}>
        <Reveal t={t} at={11.6} until={20.6}>
          <Tex tex={`\\textcolor{${AMBER}}{(x^2)'} \\cdot \\textcolor{${TEAL}}{(\\sin x)'} = 2x \\cos x`} size={36} />
        </Reveal>
      </Place>
      <Place x={1250} y={510} ax={0}>
        <Reveal t={t} at={12.6} until={20.6}>
          <span style={{fontFamily: MONO, fontSize: 30, color: C.muted, textDecoration: t > 14.9 ? 'line-through' : 'none', textDecorationColor: CORAL}}>= 1.081 at x = 1</span>
        </Reveal>
      </Place>
      <Place x={1250} y={600} ax={0}>
        <Reveal t={t} at={14.4} until={20.6}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
            <Mono size={15}>the tangent's slope</Mono>
            <span style={{fontFamily: MONO, fontSize: 44, color: C.bright}}>{fmt(hp(X0), 3)}</span>
          </div>
        </Reveal>
      </Place>

      {/* ------------------------------------------------------------ act 2 text */}
      <div style={{opacity: act2}}>
        <Place x={O.x + W0 / 2} y={O.y + 36} ax={0.5}>
          <Reveal t={t} at={22.0}>
            <Tex tex="f = x^2" size={34} color={AMBER} />
          </Reveal>
        </Place>
        <Place x={O.x - 20} y={O.y - H0 / 2} ax={1}>
          <Reveal t={t} at={22.9}>
            <Tex tex="g = \sin x" size={34} color={TEAL} />
          </Reveal>
        </Place>
        <Place x={O.x + W0 / 2} y={O.y - H0 / 2} ax={0.5} style={{opacity: areaOn}}>
          <Tex tex="fg" size={60} color={CORAL} />
        </Place>
        <Place x={O.x + W0 + dW / 2} y={O.y + 36} ax={0.5} style={{opacity: ramp(t, 27.4, 27.9) * pieceLabels}}>
          <Tex tex="df" size={32} color={AMBER} />
        </Place>
        <Place x={O.x - 20} y={O.y - H0 - dH / 2} ax={1} style={{opacity: ramp(t, 28.7, 29.2) * pieceLabels}}>
          <Tex tex="dg" size={32} color={TEAL} />
        </Place>
        <Place x={O.x + W0 + dW / 2} y={O.y - H0 / 2} ax={0.5} style={{opacity: ramp(t, 34.8, 35.3) * pieceLabels}}>
          <Tex tex="g\,df" size={38} color={C.bg} />
        </Place>
        <Place x={O.x + W0 / 2} y={O.y - H0 - dH - 30} ax={0.5} style={{opacity: ramp(t, 37.9, 38.4) * pieceLabels}}>
          <Tex tex="f\,dg" size={38} color={TEAL} />
        </Place>
        <Place x={O.x + W0 + dW + 14} y={O.y - H0 - dH - 8} ax={0} ay={1} style={{opacity: ramp(t, 39.6, 40.1) * pieceLabels}}>
          <Tex tex="df\,dg" size={32} color={C.bright} />
        </Place>
      </div>
      <Place x={1130} y={300} ax={0}>
        <Reveal t={t} at={43.3} until={58.0}>
          <Mono size={15}>area added, per unit of dx</Mono>
        </Reveal>
      </Place>
      {barsOn > 0
        ? (
            [
              ['g\\,df / dx', perDx.side, AMBER, 380],
              ['f\\,dg / dx', perDx.top, TEAL, 450],
              ['df\\,dg / dx', perDx.corner, C.bright, 520],
              ['\\text{total}', perDx.side + perDx.top + perDx.corner, CORAL, 600],
            ] as [string, number, string, number][]
          ).map(([label, v, color, y]) => (
            <React.Fragment key={y}>
              <Place x={1130} y={y} ax={0} style={{opacity: barsOn * span(t, 43.3, 58.0, 0.5, 0.5)}}>
                <Tex tex={label} size={30} color={color} inline />
              </Place>
              <Place x={BAR.x + Math.max(0, y === 600 ? 0 : v * BAR.scale) + 14} y={y} ax={0} style={{opacity: barsOn * span(t, 43.3, 58.0, 0.5, 0.5)}}>
                <span style={{fontFamily: MONO, fontSize: y === 600 ? 34 : 28, color, fontVariantNumeric: 'tabular-nums'}}>{fmt(v, 3)}</span>
              </Place>
            </React.Fragment>
          ))
        : null}
      <Place x={1130} y={700} ax={0}>
        <Reveal t={t} at={47.6} until={58.0}>
          <Tex tex={`d(fg) = \\textcolor{${AMBER}}{g\\,df} + \\textcolor{${TEAL}}{f\\,dg}`} size={44} />
        </Reveal>
      </Place>
      <Place x={1130} y={804} ax={0}>
        <Reveal t={t} at={54.1} until={58.0}>
          <div style={{padding: '12px 22px', border: `1.5px solid ${CORAL}`, borderRadius: 10}}>
            <Tex tex={`(fg)' = \\textcolor{${AMBER}}{f'g} + \\textcolor{${TEAL}}{fg'}`} size={46} />
          </div>
        </Reveal>
      </Place>

      {/* ------------------------------------------------------------ act 3 text */}
      <div style={{opacity: act3}}>
        <Place x={H.left} y={H.top - 26} ax={0}>
          <Reveal t={t} at={58.6} until={69.0}>
            <Tex tex="h(x) = x^2 \sin x" size={32} color={CORAL} />
          </Reveal>
        </Place>
        <Place x={D.left} y={D.top - 22} ax={0}>
          <Reveal t={t} at={64.0} until={69.0}>
            <span style={{display: 'flex', gap: 22, alignItems: 'baseline'}}>
              <Tex tex="h'(x)" size={30} color={C.bright} />
              <Tex tex="2x\sin x" size={26} color={AMBER} />
              <Tex tex="x^2\cos x" size={26} color={TEAL} />
              <span style={{opacity: ramp(t, 66.6, 67.2)}}>
                <Tex tex="\text{guess } 2x\cos x" size={26} color={C.muted} />
              </span>
            </span>
          </Reveal>
        </Place>
      </div>
      <Place x={1290} y={260} ax={0}>
        <Reveal t={t} at={58.4} until={69.0}>
          <Tex tex={`h'(x) = \\textcolor{${AMBER}}{2x\\sin x} + \\textcolor{${TEAL}}{x^2\\cos x}`} size={38} />
        </Reveal>
      </Place>
      <Place x={1290} y={350} ax={0}>
        <Reveal t={t} at={59.4} until={63.6}>
          <Tex tex={`h'(1) = \\textcolor{${AMBER}}{2\\sin 1} + \\textcolor{${TEAL}}{\\cos 1} = ${fmt(hp(1), 3)}`} size={34} />
        </Reveal>
      </Place>
      <Place x={1290} y={440} ax={0}>
        <Reveal t={t} at={60.9} until={63.6}>
          <span style={{fontFamily: SANS, fontWeight: 300, fontSize: 28}}>the tangent's slope: {fmt(hp(1), 3)} ✓</span>
        </Reveal>
      </Place>
      {t > 63.8 && t < 69.2 ? (
        <Place x={1290} y={340} ax={0} ay={0} style={{opacity: span(t, 64.0, 69.0, 0.4, 0.5), display: 'flex', flexDirection: 'column', gap: 10}}>
          {(
            [
              ['x', fmt(xs, 2), C.ink],
              ['2x sin x', fmt(fp(xs) * g(xs), 2), AMBER],
              ['x² cos x', fmt(f(xs) * gp(xs), 2), TEAL],
              ['sum = slope', fmt(hp(xs), 2), C.bright],
              ['guess', fmt(guess(xs), 2), C.muted],
            ] as [string, string, string][]
          ).map(([label, value, color]) => (
            <div key={label} style={{display: 'flex', justifyContent: 'space-between', width: 420, borderBottom: `1px solid ${C.faint}`, paddingBottom: 6}}>
              <Mono size={14} style={{textTransform: 'none'}}>
                {label}
              </Mono>
              <span style={{fontFamily: MONO, fontSize: 28, color, fontVariantNumeric: 'tabular-nums'}}>{value}</span>
            </div>
          ))}
        </Place>
      ) : null}

      {/* ------------------------------------------------------------ act 4 text */}
      <div style={{opacity: act4}}>
        <Place x={iso(a + GAP + 0.3, 0, c / 2).x + 28} y={iso(a + GAP + 0.3, 0, c / 2).y} ax={0} style={{opacity: ramp(t, 70.4, 70.9)}}>
          <Tex tex="f'gk" size={36} color={AMBER} />
        </Place>
        <Place x={iso(0, bb + GAP + 0.3, c / 2).x - 28} y={iso(0, bb + GAP + 0.3, c / 2).y} ax={1} style={{opacity: ramp(t, 70.8, 71.3)}}>
          <Tex tex="fg'k" size={36} color={TEAL} />
        </Place>
        <Place x={iso(0, 0, c + GAP + 0.3).x} y={iso(0, 0, c + GAP + 0.3).y - 22} ax={0.5} ay={1} style={{opacity: ramp(t, 71.2, 71.7)}}>
          <Tex tex="fgk'" size={36} color={CORAL} />
        </Place>
      </div>
      <Place x={1060} y={430} ax={0}>
        <Reveal t={t} at={70.2} until={74.8}>
          <Tex tex={`(fgk)' = \\textcolor{${AMBER}}{f'gk} + \\textcolor{${TEAL}}{fg'k} + \\textcolor{${CORAL}}{fgk'}`} size={46} />
        </Reveal>
      </Place>
      <Place x={1060} y={530} ax={0}>
        <Reveal t={t} at={71.9} until={74.8}>
          <span style={{fontFamily: SANS, fontWeight: 300, fontSize: 30}}>one slab for each factor's change</span>
        </Reveal>
      </Place>

      <Header t={t} chapter={7} title="The product rule" duration={CH7_SECONDS} />
      <Narration t={t} lines={LINES} />
      <TitleCard t={t} chapter={7} title="The product rule" subtitle="Two things growing at once" glyph="f\,g" />
      <Recap
        t={t}
        at={74.8}
        end={CH7_SECONDS}
        statement={["Two things growing at once: [[f|each one's change]], times the other.", 'The corner, a change times a change, [[w|vanishes]].']}
        tex="(fg)' = f'g + fg'"
        next="End of series · Calculus, visually"
      />
    </Board>
  );
};
