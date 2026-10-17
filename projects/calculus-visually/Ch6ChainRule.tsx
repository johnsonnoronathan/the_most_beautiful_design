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
  ticksFor,
  TitleCard,
  useT,
  useUid,
} from './kit';
import {captions, Soundtrack, Speech, VoiceScript} from './kit';
import script from './voice/ch06.json';
import speech from './voice/ch06.timing.json';
import score from './assets/ch06-score.mp3';
import voice from './assets/ch06-voice.mp3';

export const CH6_SECONDS = 82;

const LINES = captions(script as VoiceScript);

const h = (x: number) => Math.sin(x * x);
const hp = (x: number) => 2 * x * Math.cos(x * x);

// Inner stretch (du/dx) is teal, outer stretch (dy/du) coral, as everywhere in this chapter.
const TEAL = '#5CC8C2';
const CORAL = '#F07B6A';

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

// ------------------------------------------------------------------ act 1: a function inside a function

const B1: Box = {left: 180, top: 210, width: 900, height: 520, x0: -0.15, x1: 3.9, y0: -1.35, y1: 1.35};
const PX = 1360; // the pipeline's centre line
const NODES = [250, 470, 690];
const BOXES = [360, 580];

// a value travelling down the pipeline: x = 1 → square → u = 1 → sine → y ≈ 0.84
const particleY = (t: number) => {
  const legs: [number, number, number, number][] = [
    [11.4, 12.2, NODES[0], BOXES[0]],
    [12.2, 12.9, BOXES[0], NODES[1]],
    [12.9, 13.4, NODES[1], BOXES[1]],
    [13.4, 13.9, BOXES[1], NODES[2]],
  ];
  for (const [a, z, y0, y1] of legs) if (t < z) return lerp(y0, y1, ramp(t, a, z, Easing.inOut(Easing.quad)));
  return NODES[2];
};

// ------------------------------------------------------------------ act 2: three number lines

const YL = [300, 500, 700];
const LEFT = 230;
const RIGHT = 1180;
const CENTRE = [1, 1, Math.sin(1)];
const BASE = 500; // px per unit before any zoom
const P0 = (v: number) => 140 + BASE * v; // where each line's centre value sits on screen

// the nudge grows to 0.2, waits, then shrinks ten-thousandfold while every line zooms in with it
const dxAt = (t: number) => (t < 37 ? 0.2 * ramp(t, 26.2, 27.0, Easing.out(Easing.cubic)) : 0.2 * 10 ** (-4 * ramp(t, 37.0, 39.4, Easing.inOut(Easing.sin))));
const zoomAt = (t: number) => (t < 37 ? 1 : 0.2 / dxAt(t));
const onLine = (i: number, v: number, z: number) => P0(CENTRE[i]) + BASE * z * (v - CENTRE[i]);

// ------------------------------------------------------------------ act 3: check on the graph

const H: Box = {left: 180, top: 170, width: 1000, height: 290, x0: -0.1, x1: 3.3, y0: -1.25, y1: 1.25};
const D: Box = {left: 180, top: 540, width: 1000, height: 290, x0: -0.1, x1: 3.3, y0: -7.2, y1: 7.2};
const sweepAt = (t: number) => (t < 58.6 ? 1 : t < 59.2 ? lerp(1, 0, ramp(t, 58.6, 59.1)) : 3.2 * ramp(t, 59.2, 64.0, Easing.inOut(Easing.sin)));

export const Ch6ChainRule: React.FC = () => {
  const t = useT();
  const uid = useUid();

  // act 1
  const act1 = span(t, 4.8, 21.0, 0.6, 0.6);
  const curve1 = ramp(t, 5.4, 7.8);
  const pipe = span(t, 10.2, 21.0, 0.6, 0.6);

  // act 2
  const act2 = span(t, 21.8, 53.4, 0.6, 0.6);
  const dx = dxAt(t);
  const z = zoomAt(t);
  const u1 = (1 + dx) ** 2;
  const pDu = ramp(t, 27.8, 28.6, Easing.out(Easing.cubic));
  const pDy = ramp(t, 31.5, 32.3, Easing.out(Easing.cubic));
  const duEnd = lerp(1, u1, pDu);
  const dyEnd = lerp(Math.sin(1), Math.sin(u1), pDy);
  const segX = [onLine(0, 1, z), onLine(0, 1 + dx, z)];
  const segU = [onLine(1, 1, z), onLine(1, duEnd, z)];
  const segY = [onLine(2, Math.sin(1), z), onLine(2, dyEnd, z)];
  const inner = (u1 - 1) / dx || 2;
  const outer = (Math.sin(u1) - Math.sin(1)) / (u1 - 1 || 1);
  const settled = ramp(t, 39.4, 39.9);

  // act 3
  const act3 = span(t, 53.0, 69.6, 0.6, 0.6);
  const xp = sweepAt(t);
  const traceOn = ramp(t, 59.2, 59.6);
  const envelope = ramp(t, 64.6, 65.8);

  // act 4
  const cancel = [span(t, 69.8, 71.6, 0.5, 0.15), span(t, 71.45, 72.5, 0.15, 0.15), span(t, 72.35, 75.4, 0.15, 0.5)];

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

        {/* act 1: the chirp, and the pipeline that makes it */}
        {act1 > 0 ? (
          <g opacity={act1}>
            <PlainAxes b={B1} p={ramp(t, 4.8, 5.6)} xTicks={[1, 2, 3]} yTicks={[-1, 1]} />
            <g clipPath={`url(#${uid}-b1)`}>
              <Draw d={curvePath(B1, h, 0, 3.9, 700)} p={curve1} color={C.f} width={4.5} />
            </g>
            {pipe > 0 ? (
              <g opacity={pipe}>
                {[0, 1, 2, 3].map((i) => {
                  const ys = [NODES[0], BOXES[0], NODES[1], BOXES[1], NODES[2]];
                  const a = ys[i] + (i % 2 ? 40 : 26);
                  const b = ys[i + 1] - (i % 2 ? 26 : 40);
                  return <line key={i} x1={PX} y1={a} x2={PX} y2={b} stroke={C.axis} strokeWidth="2.5" />;
                })}
                {BOXES.map((y, i) => (
                  <rect key={y} x={PX - 130} y={y - 38} width={260} height={76} rx={14} fill="#151820" stroke={i ? CORAL : TEAL} strokeWidth="2" strokeOpacity={0.7} />
                ))}
                <circle cx={PX} cy={particleY(t)} r={9} fill={C.f} opacity={span(t, 11.2, 14.2, 0.3, 0.3)} />
              </g>
            ) : null}
          </g>
        ) : null}

        {/* act 2: x → u → y, each on its own line, with the nudge fanning out between them */}
        {act2 > 0 ? (
          <g opacity={act2}>
            {pDu > 0 ? (
              <path d={`M${segX[0]},${YL[0] + 8}L${segX[1]},${YL[0] + 8}L${segU[1]},${YL[1] - 8}L${segU[0]},${YL[1] - 8}Z`} fill={TEAL} opacity={0.16 * pDu} />
            ) : null}
            {pDy > 0 ? (
              <path d={`M${segU[0]},${YL[1] + 8}L${segU[1]},${YL[1] + 8}L${segY[1]},${YL[2] - 8}L${segY[0]},${YL[2] - 8}Z`} fill={CORAL} opacity={0.16 * pDy} />
            ) : null}
            {YL.map((y, i) => {
              const draw = ramp(t, 22.3 + i * 0.65, 23.0 + i * 0.65, Easing.out(Easing.cubic));
              const a = CENTRE[i] + (LEFT - P0(CENTRE[i])) / (BASE * z);
              const zz = CENTRE[i] + (RIGHT - P0(CENTRE[i])) / (BASE * z);
              const {ticks, text} = ticksFor(a, zz, RIGHT - LEFT);
              return (
                <g key={y} opacity={draw > 0 ? 1 : 0}>
                  <line x1={LEFT} y1={y} x2={lerp(LEFT, RIGHT, draw)} y2={y} stroke={C.axis} strokeWidth="2.5" strokeLinecap="round" />
                  {ticks.map(({v, line, label}) => {
                    const px = onLine(i, v, z);
                    return (
                      <g key={v} opacity={draw}>
                        <line x1={px} y1={y - 7} x2={px} y2={y + 7} stroke={C.axis} strokeWidth="2" opacity={line} />
                        {label > 0 ? (
                          <text x={px} y={y + 36} textAnchor="middle" fill={C.muted} opacity={label} style={{fontFamily: MONO, fontSize: 18}}>
                            {text(v)}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
                </g>
              );
            })}
            {/* the value flows down: x = 1 → u = 1 → y = sin 1 */}
            {[0, 1].map((i) => (
              <line
                key={i}
                x1={onLine(i, CENTRE[i], z)}
                y1={YL[i] + 14}
                x2={lerp(onLine(i, CENTRE[i], z), onLine(i + 1, CENTRE[i + 1], z), ramp(t, 24.0 + i * 0.5, 24.6 + i * 0.5))}
                y2={lerp(YL[i] + 14, YL[i + 1] - 14, ramp(t, 24.0 + i * 0.5, 24.6 + i * 0.5))}
                stroke={C.muted}
                strokeWidth="2"
                strokeDasharray="5 7"
                opacity={ramp(t, 24.0 + i * 0.5, 24.2 + i * 0.5) * (1 - ramp(t, 26.0, 26.6))}
              />
            ))}
            {dx > 0 ? <line x1={segX[0]} y1={YL[0]} x2={segX[1]} y2={YL[0]} stroke={C.bright} strokeWidth="8" strokeLinecap="round" /> : null}
            {pDu > 0 ? <line x1={segU[0]} y1={YL[1]} x2={segU[1]} y2={YL[1]} stroke={TEAL} strokeWidth="8" strokeLinecap="round" /> : null}
            {pDy > 0 ? <line x1={segY[0]} y1={YL[2]} x2={segY[1]} y2={YL[2]} stroke={CORAL} strokeWidth="8" strokeLinecap="round" /> : null}
            {YL.map((y, i) => (
              <Dot key={y} x={onLine(i, CENTRE[i], z)} y={y} color={C.ink} o={ramp(t, 23.4 + i * 0.5, 23.8 + i * 0.5)} />
            ))}
          </g>
        ) : null}

        {/* act 3: the slope of sin(x²), and its envelope */}
        {act3 > 0 ? (
          <g opacity={act3}>
            <PlainAxes b={H} p={ramp(t, 53.2, 54.0)} xTicks={[1, 2, 3]} yTicks={[-1, 1]} />
            <g clipPath={`url(#${uid}-h)`}>
              <Draw d={curvePath(H, h, 0, 3.3, 500)} p={ramp(t, 53.4, 54.8)} color={C.f} width={4} />
              <line {...slopeLine(H, xp, h(xp), hp(xp), xp - 0.28, xp + 0.28)} stroke={C.d} strokeWidth="3.5" strokeLinecap="round" opacity={ramp(t, 55.0, 55.5)} />
            </g>
            <Dot x={sx(H, xp)} y={sy(H, h(xp))} color={C.f} o={ramp(t, 55.0, 55.5)} />

            <PlainAxes b={D} p={ramp(t, 58.6, 59.4)} xTicks={[1, 2, 3]} yTicks={[-5, 5]} />
            <g clipPath={`url(#${uid}-d)`}>
              {envelope > 0 ? (
                <>
                  <Draw d={curvePath(D, (x) => 2 * x, 0, 3.3)} p={envelope} color={C.ink} width={2.5} dash="8 9" opacity={0.7} />
                  <Draw d={curvePath(D, (x) => -2 * x, 0, 3.3)} p={envelope} color={C.ink} width={2.5} dash="8 9" opacity={0.7} />
                </>
              ) : null}
              {traceOn > 0 && xp > 0.01 ? <path d={curvePath(D, hp, 0, xp, 500)} fill="none" stroke={C.d} strokeWidth="4" strokeLinecap="round" opacity={traceOn} /> : null}
            </g>
            {traceOn > 0 ? (
              <g opacity={traceOn}>
                <line x1={sx(H, xp)} y1={sy(H, h(xp))} x2={sx(D, xp)} y2={sy(D, hp(xp))} stroke={C.d} strokeWidth="1.5" strokeDasharray="4 8" opacity={0.45} />
                <Dot x={sx(D, xp)} y={sy(D, hp(xp))} color={C.d} />
              </g>
            ) : null}
          </g>
        ) : null}
      </svg>

      {/* ------------------------------------------------------------ act 1 text */}
      <div style={{opacity: act1}}>
        <Place x={sx(B1, 0.12)} y={sy(B1, 1.22)} ax={0}>
          <Reveal t={t} at={7.0} until={21.0}>
            <Tex tex="h(x) = \sin(x^2)" size={38} color={C.f} />
          </Reveal>
        </Place>
        <div style={{opacity: pipe}}>
          {(
            [
              ['x', 0, 10.6],
              ['u', 1, 12.9],
              ['y', 2, 13.9],
            ] as [string, number, number][]
          ).map(([v, i, at]) => (
            <Place key={v} x={PX} y={NODES[i]} ax={0.5}>
              <div style={{opacity: ramp(t, at - 0.2, at + 0.3)}}>
                <Tex tex={v} size={40} />
              </div>
            </Place>
          ))}
          {(
            [
              ['= 1', 0, 11.0],
              ['= 1', 1, 12.9],
              ['= \\sin 1 \\approx 0.84', 2, 13.9],
            ] as [string, number, number][]
          ).map(([v, i, at]) => (
            <Place key={i} x={PX + 26} y={NODES[i]} ax={0}>
              <Reveal t={t} at={at} dur={0.5}>
                <Tex tex={v} size={32} color={C.f} />
              </Reveal>
            </Place>
          ))}
          <Place x={PX} y={BOXES[0]} ax={0.5}>
            <Reveal t={t} at={10.8}>
              <Tex tex="u = x^2" size={36} />
            </Reveal>
          </Place>
          <Place x={PX} y={BOXES[1]} ax={0.5}>
            <Reveal t={t} at={11.0}>
              <Tex tex="y = \sin u" size={36} />
            </Reveal>
          </Place>
          <Place x={PX + 152} y={BOXES[0] - 20} ax={0}>
            <Reveal t={t} at={15.6}>
              <Mono size={14}>Chapter 1</Mono>
            </Reveal>
          </Place>
          <Place x={PX + 152} y={BOXES[0] + 18} ax={0}>
            <Reveal t={t} at={15.6}>
              <Tex tex="(x^2)' = 2x" size={36} color={TEAL} />
            </Reveal>
          </Place>
          <Place x={PX + 152} y={BOXES[1] - 20} ax={0}>
            <Reveal t={t} at={16.4}>
              <Mono size={14}>Chapter 5</Mono>
            </Reveal>
          </Place>
          <Place x={PX + 152} y={BOXES[1] + 18} ax={0}>
            <Reveal t={t} at={16.4}>
              <Tex tex="(\sin u)' = \cos u" size={36} color={CORAL} />
            </Reveal>
          </Place>
        </div>
      </div>

      {/* ------------------------------------------------------------ act 2 text */}
      <div style={{opacity: act2}}>
        {(['x', 'u = x^2', 'y = \\sin u'] as string[]).map((tex, i) => (
          <Place key={tex} x={LEFT - 30} y={YL[i]} ax={1}>
            <Reveal t={t} at={22.4 + i * 0.65}>
              <Tex tex={tex} size={34} />
            </Reveal>
          </Place>
        ))}
        {dx > 0 ? (
          <Place x={(segX[0] + segX[1]) / 2} y={YL[0] - 34} ax={0.5} style={{opacity: ramp(t, 26.4, 26.9)}}>
            <Tex tex="dx" size={30} color={C.bright} />
          </Place>
        ) : null}
        {pDu > 0 ? (
          <Place x={(segU[0] + segU[1]) / 2} y={YL[1] - 34} ax={0.5} style={{opacity: pDu}}>
            <Tex tex="du" size={30} color={TEAL} />
          </Place>
        ) : null}
        {pDy > 0 ? (
          <Place x={(segY[0] + segY[1]) / 2} y={YL[2] - 34} ax={0.5} style={{opacity: pDy}}>
            <Tex tex="dy" size={30} color={CORAL} />
          </Place>
        ) : null}
        {/* the stretch on each fan: live while the nudge is big, exact once it settles */}
        {pDu > 0 ? (
          <Place x={Math.max(segX[1], segU[1]) + 26} y={(YL[0] + YL[1]) / 2} ax={0} style={{opacity: ramp(t, 29.4, 29.9)}}>
            <Tex tex={settled > 0.5 ? '\\times\\,2' : `\\times\\,${fmt(inner, 2)}`} size={36} color={TEAL} />
          </Place>
        ) : null}
        {pDy > 0 ? (
          <Place x={Math.max(segU[1], segY[1]) + 26} y={(YL[1] + YL[2]) / 2} ax={0} style={{opacity: ramp(t, 33.6, 34.1)}}>
            <Tex tex={t > 40.0 ? '\\times\\,\\cos 1' : `\\times\\,${fmt(outer, 2)}`} size={36} color={CORAL} />
          </Place>
        ) : null}
      </div>

      {/* right panel: the stretch factors, then the rule */}
      <Place x={1300} y={250} ax={0}>
        <Reveal t={t} at={28.2} until={53.0}>
          <Mono size={15}>Stretch factors</Mono>
        </Reveal>
      </Place>
      {(
        [
          ['du / dx', inner, TEAL, 28.4, 310],
          ['dy / du', outer, CORAL, 32.2, 368],
          ['dy / dx', inner * outer, C.bright, 42.4, 426],
        ] as [string, number, string, number, number][]
      ).map(([label, value, color, at, y]) => (
        <Place key={label} x={1300} y={y} ax={0}>
          <Reveal t={t} at={at} until={53.0}>
            <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: 440, borderBottom: `1px solid ${C.faint}`, paddingBottom: 8}}>
              <Tex tex={label} size={30} color={color} inline />
              <span style={{fontFamily: MONO, fontSize: 32, color, fontVariantNumeric: 'tabular-nums'}}>{fmt(value, 3)}</span>
            </div>
          </Reveal>
        </Place>
      ))}
      <Place x={1300} y={560} ax={0}>
        <Reveal t={t} at={42.4} until={53.0}>
          <Tex tex={`\\frac{dy}{dx} = \\textcolor{${CORAL}}{\\frac{dy}{du}} \\cdot \\textcolor{${TEAL}}{\\frac{du}{dx}}`} size={54} />
        </Reveal>
      </Place>
      <Place x={1300} y={694} ax={0}>
        <Reveal t={t} at={44.1} until={53.0}>
          <span style={{fontFamily: SANS, fontWeight: 300, fontSize: 30, color: C.ink}}>the chain rule</span>
        </Reveal>
      </Place>
      <Place x={1300} y={790} ax={0}>
        <Reveal t={t} at={50.4} until={53.0}>
          <Tex tex={`h'(x) = \\textcolor{${CORAL}}{\\cos(x^2)} \\cdot \\textcolor{${TEAL}}{2x}`} size={40} />
        </Reveal>
      </Place>

      {/* ------------------------------------------------------------ act 3 text */}
      <div style={{opacity: act3}}>
        <Place x={H.left} y={H.top - 26} ax={0}>
          <Reveal t={t} at={54.0} until={69.6}>
            <Tex tex="h(x) = \sin(x^2)" size={32} color={C.f} />
          </Reveal>
        </Place>
        <Place x={D.left} y={D.top - 22} ax={0}>
          <Reveal t={t} at={59.2} until={69.6}>
            <Tex tex="h'(x)" size={32} color={C.d} />
          </Reveal>
        </Place>
        <Place x={sx(D, 3.3) + 12} y={sy(D, 6.6)} ax={0}>
          <Reveal t={t} at={65.4} until={69.6}>
            <Tex tex="2x" size={30} color={C.ink} />
          </Reveal>
        </Place>
        <Place x={sx(D, 3.3) + 12} y={sy(D, -6.6)} ax={0}>
          <Reveal t={t} at={65.6} until={69.6}>
            <Tex tex="-2x" size={30} color={C.ink} />
          </Reveal>
        </Place>
      </div>
      <Place x={1300} y={250} ax={0}>
        <Reveal t={t} at={55.2} until={58.6}>
          <Mono size={15}>slope of the tangent at x = 1</Mono>
        </Reveal>
      </Place>
      <Place x={1300} y={320} ax={0}>
        <Reveal t={t} at={55.4} until={58.6}>
          <span style={{fontFamily: MONO, fontSize: 52, color: C.d}}>{fmt(hp(1), 3)}</span>
        </Reveal>
      </Place>
      <Place x={1300} y={420} ax={0}>
        <Reveal t={t} at={56.4} until={58.6}>
          <Tex tex={`\\textcolor{${CORAL}}{\\cos 1} \\cdot \\textcolor{${TEAL}}{2} = ${fmt(hp(1), 3)}`} size={40} />
        </Reveal>
      </Place>
      <Place x={1300} y={300} ax={0}>
        <Reveal t={t} at={59.0} until={69.4}>
          <Tex tex={`h'(x) = \\textcolor{${CORAL}}{\\cos(x^2)} \\cdot \\textcolor{${TEAL}}{2x}`} size={44} />
        </Reveal>
      </Place>
      <Place x={1300} y={400} ax={0}>
        <Reveal t={t} at={60.2} until={69.4}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
            <Mono size={13} color={CORAL}>
              outer factor
            </Mono>
            <span style={{fontFamily: SANS, fontWeight: 300, fontSize: 28}}>swings between −1 and 1</span>
          </div>
        </Reveal>
      </Place>
      <Place x={1300} y={500} ax={0}>
        <Reveal t={t} at={64.4} until={69.4}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
            <Mono size={13} color={TEAL}>
              inner factor
            </Mono>
            <span style={{fontFamily: SANS, fontWeight: 300, fontSize: 28}}>grows, setting the envelope ±2x</span>
          </div>
        </Reveal>
      </Place>
      {t > 59.2 && t < 69.6 ? (
        <Place x={1300} y={640} ax={0} style={{opacity: span(t, 59.4, 69.4, 0.4, 0.5), display: 'flex', gap: 48}}>
          {(
            [
              ['x', fmt(xp, 2), C.ink],
              ['cos(x²)', fmt(Math.cos(xp * xp), 2), CORAL],
              ['2x', fmt(2 * xp, 2), TEAL],
            ] as [string, string, string][]
          ).map(([label, value, color]) => (
            <div key={label} style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              <Mono size={13} style={{textTransform: 'none'}}>
                {label}
              </Mono>
              <span style={{fontFamily: MONO, fontSize: 34, color, fontVariantNumeric: 'tabular-nums'}}>{value}</span>
            </div>
          ))}
        </Place>
      ) : null}

      {/* ------------------------------------------------------------ act 4: the du's cancel */}
      {[
        '\\frac{dy}{du}\\cdot\\frac{du}{dx}',
        '\\frac{dy}{\\cancel{du}}\\cdot\\frac{\\cancel{du}}{dx}',
        '\\frac{dy}{\\cancel{du}}\\cdot\\frac{\\cancel{du}}{dx} = \\frac{dy}{dx}',
      ].map((tex, i) =>
        cancel[i] > 0 ? (
          <Place key={i} x={lerp(775, 610, ramp(t, 72.3, 72.9, Easing.inOut(Easing.cubic)))} y={430} ax={0} style={{opacity: cancel[i]}}>
            <Tex tex={tex} size={96} />
          </Place>
        ) : null,
      )}
      <Place x={960} y={640} ax={0.5}>
        <Reveal t={t} at={73.2} until={75.4}>
          <Mono size={16}>Leibniz notation · a reminder, not real fractions</Mono>
        </Reveal>
      </Place>

      <Header t={t} chapter={6} title="The chain rule" duration={CH6_SECONDS} />
      <Narration t={t} lines={LINES} />
      <TitleCard t={t} chapter={6} title="The chain rule" subtitle="Rates that multiply" glyph="f\circ g" />
      <Recap
        t={t}
        at={75.4}
        end={CH6_SECONDS}
        statement={['A function inside a function: the rates [[w|multiply]].', 'The [[a|outer slope]], at the inner value, times the [[d|inner slope]].']}
        tex="\frac{d}{dx}\,f(g(x)) = f'(g(x))\,g'(x)"
        next="Next · Chapter 7 · The product rule"
      />
    </Board>
  );
};
