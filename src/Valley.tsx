import React from 'react';
import {clamp, elevation, Geometry, mix, paletteAt} from './engine';

// The valley at one instant: sky, weather, mountains, forest, and a lake that
// mirrors all of it. Everything is a pure function of (frame, hour, pan).

const X0 = -90;

const SHOOTING_STARS = [
  {f: 70, x: 1540, y: 190},
  {f: 1318, x: 1260, y: 230},
  {f: 1372, x: 620, y: 160},
];

const FLOCKS = [
  {f0: 500, f1: 760, y: 330, dir: 1},
  {f0: 830, f1: 1070, y: 395, dir: -1},
];

const V = [
  [0, 0],
  [-26, -12],
  [-24, 14],
  [-52, -22],
  [-48, 27],
  [-80, -30],
  [-74, 41],
  [-110, -36],
  [-104, 52],
];

export const Valley: React.FC<{frame: number; hour: number; pan: number; geo: Geometry}> = ({frame, hour, pan, geo}) => {
  const {W, H, horizon, shore} = geo;
  const p = paletteAt(hour);
  const e = elevation(hour);
  const day = clamp(e * 3);

  const sunX = X0 + W * (0.12 + 0.76 * ((hour - 6) / 12));
  const sunY = horizon - e * (horizon - 170);
  const hm = (hour + 12) % 24;
  const em = elevation(hm);
  const moonX = X0 + W * (0.12 + 0.76 * ((hm - 6) / 12));
  const moonY = horizon - em * (horizon - 210);
  const moonO = em > 0 ? clamp(em * 4) * clamp(p.starO * 1.2 + 0.15) : 0;

  const cloudLow = mix(mix(p.skyLow, p.sun, clamp(p.glowO) * 0.6), '#FFFFFF', day * 0.4);
  const cloudHigh = mix(mix(cloudLow, p.skyMid, 0.45 * (1 - day)), '#FFFFFF', day * 0.35);
  const raysO = clamp(1 - Math.abs(e - 0.08) / 0.24) * 0.3;
  const glitterO = clamp((e + 0.03) * 8) * (0.35 + 0.65 * clamp(p.glowO));
  const fireflyO = clamp((p.starO - 0.35) * 1.8);
  const mistO = 0.65 + 0.7 * clamp(1 - Math.abs(hour - 7.2) / 2.6);
  const pineCol = mix(p.far, p.near, 0.9);
  const reedCol = mix(p.near, '#000000', 0.5);

  const drift1 = frame * 0.45;
  const drift2 = frame * 0.8;
  const meteorStars = SHOOTING_STARS.map((s) => ({...s, t: (frame - s.f) / 26})).filter((s) => s.t > 0 && s.t < 1);

  return (
    <>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="0.5" stopColor={p.skyMid} />
          <stop offset="0.84" stopColor={p.skyLow} />
          <stop offset="1" stopColor={p.horizon} />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={p.sun} stopOpacity="0.85" />
          <stop offset="0.25" stopColor={p.sun} stopOpacity="0.32" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sunHalo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.3" stopColor={p.sun} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rayFade" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1300">
          <stop offset="0" stopColor={p.sun} stopOpacity="0.6" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.horizon} stopOpacity="0" />
          <stop offset="0.5" stopColor={p.horizon} stopOpacity="0.3" />
          <stop offset="1" stopColor={p.horizon} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cloudShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={cloudHigh} />
          <stop offset="1" stopColor={cloudLow} />
        </linearGradient>
        <linearGradient id="cloudFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.3" stopColor="#fff" />
          <stop offset="0.7" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id="cloudMask" maskUnits="userSpaceOnUse" x="-200" y="0" width={W + 400} height={horizon + 40}>
          <rect x="-200" y="110" width={W + 400} height={horizon - 120} fill="url(#cloudFade)" />
        </mask>
        <filter id="cumulus" x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.0011 0.0042" numOctaves={5} seed={11} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.4 0 0 0 -1.55" result="a" />
          <feComposite in="SourceGraphic" in2="a" operator="in" />
        </filter>
        <filter id="cirrus" x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.0005 0.016" numOctaves={3} seed={23} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.0 0 0 0 -1.5" result="a" />
          <feComposite in="SourceGraphic" in2="a" operator="in" />
        </filter>
        <filter id="ripple" filterUnits="userSpaceOnUse" x="-200" y={shore - 1300} width={W + 400} height={H - shore + 1400} colorInterpolationFilters="sRGB">
          <feTurbulence type="turbulence" baseFrequency="0.0022 0.07" numOctaves={2} seed={4} result="w" />
          <feOffset in="w" dx={Math.sin(frame * 0.02) * 6} dy={frame * 0.45} result="wm" />
          <feDisplacementMap in="SourceGraphic" in2="wm" scale="24" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="0.5 1.6" />
        </filter>
        <clipPath id="lakeClip">
          <rect x="-200" y={shore} width={W + 400} height={H - shore + 20} />
        </clipPath>
        <linearGradient id="lakeTint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.near} stopOpacity="0.18" />
          <stop offset="1" stopColor={p.near} stopOpacity="0.78" />
        </linearGradient>
        <radialGradient id="ff" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFE9A0" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFE9A0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vignette" cx="0.5" cy="0.48" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.6" />
        </radialGradient>
        <linearGradient id="meteor" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <g id="scene">
          <rect x="-200" y="-20" width={W + 400} height={shore + 40} fill="url(#sky)" />

          <g opacity={p.starO}>
            {geo.stars.map((s, i) => (
              <circle key={i} cx={X0 + s.x} cy={s.y} r={s.r} fill="#FFF6E8" opacity={0.55 + 0.45 * Math.sin(frame * s.sp + s.ph)} />
            ))}
            {meteorStars.map((s) => {
              const len = 190 * Math.sin(s.t * Math.PI);
              const hx = s.x - 340 * s.t;
              const hy = s.y + 150 * s.t;
              return (
                <line key={s.f} x1={hx} y1={hy} x2={hx + len * 0.915} y2={hy - len * 0.404} stroke="#FFFFFF" strokeOpacity={Math.sin(s.t * Math.PI)} strokeWidth="1.6" strokeLinecap="round" />
              );
            })}
          </g>

          <circle cx={moonX} cy={moonY} r="70" fill="#F4EEE2" opacity={moonO * 0.06} />
          <circle cx={moonX} cy={moonY} r="20" fill="#F4EEE2" opacity={moonO} />

          <g transform={`translate(${sunX} ${sunY}) rotate(${frame * 0.03})`} opacity={raysO} style={{mixBlendMode: 'screen'}}>
            <path d={geo.rays} fill="url(#rayFade)" />
          </g>
          <circle cx={sunX} cy={sunY} r="1050" fill="url(#glow)" opacity={p.glowO} />
          <circle cx={sunX} cy={sunY} r="150" fill="url(#sunHalo)" />
          <circle cx={sunX} cy={sunY} r="46" fill={p.sun} />

          <g mask="url(#cloudMask)">
            <g transform={`translate(${-drift2 + pan * 0.05} 0)`} opacity={0.5}>
              <rect x={drift2 - 260} y="110" width={W + 480} height="240" fill="url(#cloudShade)" filter="url(#cirrus)" />
            </g>
            <g transform={`translate(${-drift1 + pan * 0.08} 0)`} opacity={0.92}>
              <rect x={drift1 - 260} y="150" width={W + 480} height={horizon - 150} fill="url(#cloudShade)" filter="url(#cumulus)" />
            </g>
          </g>

          {FLOCKS.map((fl) => {
            const t = (frame - fl.f0) / (fl.f1 - fl.f0);
            if (t <= 0 || t >= 1) return null;
            const cx = fl.dir > 0 ? -150 + t * (W + 100) : W - 100 - t * (W + 100);
            return (
              <g key={fl.f0} transform={`translate(${cx} ${fl.y + Math.sin(t * 9) * 14}) scale(${fl.dir} 1)`} opacity={0.85}>
                {V.map(([bx, by], i) => {
                  const flap = Math.sin(frame * 0.42 + i * 1.3);
                  const wy = -5 * flap;
                  return (
                    <path key={i} d={`M${bx - 9},${by + 1}Q${bx - 4.5},${by + wy} ${bx},${by}Q${bx + 4.5},${by + wy} ${bx + 9},${by + 1}`} fill="none" stroke={mix(p.near, '#000000', 0.2)} strokeWidth="1.7" strokeLinecap="round" />
                  );
                })}
              </g>
            );
          })}

          {geo.ridges.map((r, i) => (
            <g key={i} transform={`translate(${X0 + pan * (0.1 + 0.9 * r.t)} 0)`}>
              <path d={r.d} fill={mix(p.far, p.near, Math.pow(r.t, 0.7))} />
              {[2, 5, 8, 11].includes(i) ? (
                <rect x="-200" y={r.base - 60} width={W + 400} height="110" fill="url(#mist)" opacity={mistO * (1 - r.t * 0.6)} />
              ) : null}
            </g>
          ))}

          <g transform={`translate(${X0 + pan} 0)`}>
            <path d={geo.pines} fill={pineCol} />
            <path d={geo.shoreLine} fill={pineCol} />
          </g>
        </g>
      </defs>

      <use href="#scene" />

      <g clipPath="url(#lakeClip)">
        <g filter="url(#ripple)">
          <use href="#scene" transform={`matrix(1 0 0 -1 0 ${2 * shore})`} />
        </g>
        <rect x="-200" y={shore} width={W + 400} height={H - shore} fill="url(#lakeTint)" />
        <rect x="-200" y={shore - 30} width={W + 400} height="70" fill="url(#mist)" opacity={mistO} />
        <rect x="-200" y={shore} width={W + 400} height="1.4" fill={p.horizon} opacity="0.35" />

        <g transform={`translate(${sunX} 0)`} fill={p.sun} opacity={glitterO}>
          {geo.glitter.map((d, k) => (
            <path key={k} d={d} opacity={0.25 + 0.75 * (0.5 + 0.5 * Math.sin(frame * 0.33 + k * 2.1))} />
          ))}
        </g>
        <g transform={`translate(${moonX} 0)`} fill="#E8ECF4" opacity={moonO * 0.55}>
          {geo.glitter.map((d, k) => (
            <path key={k} d={d} opacity={0.25 + 0.75 * (0.5 + 0.5 * Math.sin(frame * 0.27 + k * 2.1))} />
          ))}
        </g>
      </g>

      {fireflyO > 0.01 ? (
        <g opacity={fireflyO}>
          {geo.fireflies.map((f, i) => {
            const x = X0 + f.x + Math.sin(frame * f.sp + f.ph) * f.ax;
            const y = f.y + Math.cos(frame * f.sp * 0.7 + f.ph) * f.ay;
            const blink = clamp(0.4 + 0.9 * Math.sin(frame * f.sp * 3 + f.ph * 2));
            return (
              <g key={i} opacity={blink}>
                <circle cx={x} cy={y} r={f.r * 6} fill="url(#ff)" opacity="0.55" />
                <circle cx={x} cy={y} r={f.r} fill="#FFF4C2" />
              </g>
            );
          })}
        </g>
      ) : null}

      <g transform={`translate(${X0 + pan * 1.4} 0)`}>
        {geo.reeds.map((r, i) => (
          <path key={i} d={r.d} fill={reedCol} transform={`rotate(${Math.sin(frame * 0.035 + r.ph) * 1.3} ${r.x} ${H})`} />
        ))}
      </g>

      <rect x="0" y="0" width="1920" height="1080" fill="url(#vignette)" />
    </>
  );
};
