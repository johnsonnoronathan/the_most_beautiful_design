// Afterglow landscape engine: deterministic geometry for one valley, and the
// colour of its light at any hour of the day.

export type Palette = {
  skyTop: string;
  skyMid: string;
  skyLow: string;
  horizon: string;
  far: string;
  near: string;
  sun: string;
  starO: number;
  glowO: number;
};

export const rng = (seed: number) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return (
    '#' +
    A.map((v, i) =>
      Math.round(v + (B[i] - v) * t)
        .toString(16)
        .padStart(2, '0'),
    ).join('')
  );
};

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

const NIGHT: Omit<Palette, never> = {
  skyTop: '#03040C',
  skyMid: '#0A1130',
  skyLow: '#16224A',
  horizon: '#25335E',
  far: '#283458',
  near: '#03050B',
  sun: '#FFB06A',
  starO: 1,
  glowO: 0,
};

const KEYS: (Palette & {h: number})[] = [
  {h: 0, ...NIGHT},
  {h: 4.6, skyTop: '#070B22', skyMid: '#1E2456', skyLow: '#5A4A84', horizon: '#C98A8E', far: '#4F4775', near: '#080A16', sun: '#FFB06A', starO: 0.7, glowO: 0.12},
  {h: 6, skyTop: '#2A3A78', skyMid: '#7F78B0', skyLow: '#F0A98C', horizon: '#FFD3A1', far: '#9C88AE', near: '#16152A', sun: '#FFC27A', starO: 0.08, glowO: 0.75},
  {h: 8.5, skyTop: '#3C78C4', skyMid: '#86B6E2', skyLow: '#CFE2F0', horizon: '#F6EAD6', far: '#A3B9CF', near: '#22323F', sun: '#FFF6E4', starO: 0, glowO: 0.45},
  {h: 12.5, skyTop: '#2762C4', skyMid: '#6FA8EA', skyLow: '#B8DAF6', horizon: '#E6F3FC', far: '#AFC6DB', near: '#1C3236', sun: '#FFFFFF', starO: 0, glowO: 0.35},
  {h: 16.5, skyTop: '#3767AE', skyMid: '#8FA6C8', skyLow: '#F1C38E', horizon: '#FFDCA4', far: '#C9A188', near: '#261C20', sun: '#FFD08A', starO: 0, glowO: 0.75},
  {h: 18, skyTop: '#1B2158', skyMid: '#6A4A86', skyLow: '#E9805E', horizon: '#FFB873', far: '#B66F86', near: '#120D1C', sun: '#FFB06A', starO: 0.05, glowO: 0.95},
  {h: 19.3, skyTop: '#0A0D2C', skyMid: '#33285A', skyLow: '#A2506A', horizon: '#F08A5D', far: '#9A5C7E', near: '#0A0814', sun: '#FFB06A', starO: 0.45, glowO: 0.5},
  {h: 20.8, skyTop: '#050822', skyMid: '#141C4A', skyLow: '#2F3A78', horizon: '#5B5E98', far: '#363C6C', near: '#05060F', sun: '#FFB06A', starO: 0.85, glowO: 0.08},
  {h: 24, ...NIGHT},
];

const COLOR_KEYS = ['skyTop', 'skyMid', 'skyLow', 'horizon', 'far', 'near', 'sun'] as const;

export const paletteAt = (h: number): Palette => {
  let i = 0;
  while (i < KEYS.length - 2 && h > KEYS[i + 1].h) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  let t = clamp((h - a.h) / (b.h - a.h));
  t = t * t * (3 - 2 * t);
  const p = {} as Palette;
  for (const k of COLOR_KEYS) p[k] = mix(a[k], b[k], t);
  p.starO = a.starO + (b.starO - a.starO) * t;
  p.glowO = a.glowO + (b.glowO - a.glowO) * t;
  return p;
};

// Sun elevation, -1..1: rises at 06:00, sets at 18:00.
export const elevation = (h: number) => Math.sin((Math.PI * (h - 6)) / 12);

export type Ridge = {d: string; t: number; base: number};
export type Star = {x: number; y: number; r: number; ph: number; sp: number};
export type Firefly = {x: number; y: number; r: number; ph: number; sp: number; ax: number; ay: number};

export type Geometry = {
  W: number;
  H: number;
  horizon: number;
  floor: number;
  shore: number;
  ridges: Ridge[];
  pines: string;
  shoreLine: string;
  stars: Star[];
  glitter: string[];
  rays: string;
  fireflies: Firefly[];
  reeds: {d: string; x: number; ph: number}[];
};

const circle = (x: number, y: number, r: number) => {
  const rs = r.toFixed(2);
  const d = (2 * r).toFixed(2);
  return `M${(x - r).toFixed(1)},${y.toFixed(1)}a${rs},${rs} 0 1,0 ${d},0a${rs},${rs} 0 1,0 -${d},0`;
};

const pine = (x: number, base: number, h: number, rnd: () => number) => {
  const w = h * (0.28 + rnd() * 0.08);
  const L = 6;
  const tiers: [number, number, number][] = [];
  for (let l = 0; l < L; l++) {
    const y = base - h * (0.08 + (0.85 * l) / L);
    const yIn = base - h * (0.08 + (0.85 * (l + 0.6)) / L);
    const hw = (w / 2) * (1 - l / L) * (0.85 + rnd() * 0.3);
    tiers.push([hw, y, yIn]);
  }
  let d = `M${(x - 1).toFixed(1)},${base}`;
  for (const [hw, y, yIn] of tiers) d += `L${(x - hw).toFixed(1)},${y.toFixed(1)}L${(x - hw * 0.25).toFixed(1)},${yIn.toFixed(1)}`;
  d += `L${x.toFixed(1)},${(base - h).toFixed(1)}`;
  for (let i = tiers.length - 1; i >= 0; i--) {
    const [hw, y, yIn] = tiers[i];
    d += `L${(x + hw * 0.25).toFixed(1)},${yIn.toFixed(1)}L${(x + hw).toFixed(1)},${y.toFixed(1)}`;
  }
  return d + `L${(x + 1).toFixed(1)},${base}Z`;
};

export const buildGeometry = (seed: number, W: number, H: number, horizon: number, floor: number, shore: number): Geometry => {
  const rnd = rng(seed);
  const k = (floor - horizon) / 440;
  const fs = 1 / Math.sqrt(k);

  const ridges: Ridge[] = [];
  for (let i = 0; i < 18; i++) {
    const t = i / 17;
    const base = horizon + 4 + Math.pow(t, 1.7) * (floor - horizon);
    const amp = (40 - 28 * t + 150 * Math.pow(t, 1.25)) * k;
    const waves = Array.from({length: 5}, (_, j) => ({
      f: (0.0035 + rnd() * 0.004) * Math.pow(1.95, j) * fs,
      p: rnd() * Math.PI * 2,
      a: Math.pow(0.5, j),
    }));
    const rp = rnd() * Math.PI * 2;
    let d = `M0,${shore}`;
    for (let x = 0; x <= W + 5; x += 5) {
      let v = 0;
      for (const q of waves) v += q.a * Math.sin(x * q.f + q.p);
      v = v * 0.75 + (1 - Math.abs(Math.sin(x * waves[0].f * 0.8 + rp))) * 0.6;
      d += `L${x},${Math.min(shore, base - amp * (v + 1) * 0.5).toFixed(1)}`;
    }
    ridges.push({d: d + `L${W + 5},${shore}Z`, t, base});
  }

  const sc = (shore - horizon) / 190;
  let pines = '';
  const clusters: [number, number, number, number][] = [
    [0, 0.27 * W, Math.round(W / 40), 1],
    [0.78 * W, W, Math.round(W / 58), 1],
    [0.27 * W, 0.78 * W, 7, 0.45],
  ];
  for (const [x0, x1, n, scale] of clusters) {
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * (x1 - x0);
      pines += pine(x, shore + 2, (22 + rnd() * 52) * sc * scale, rnd);
    }
  }

  let shoreLine = `M0,${shore + 6}`;
  for (let x = 0; x <= W + 8; x += 8) shoreLine += `L${x},${(shore - 1 - rnd() * 3 * sc).toFixed(1)}`;
  shoreLine += `L${W + 8},${shore + 6}Z`;

  const stars: Star[] = Array.from({length: 420}, () => ({
    x: rnd() * W,
    y: Math.pow(rnd(), 1.5) * (horizon - 40),
    r: 0.4 + Math.pow(rnd(), 3) * 1.8,
    ph: rnd() * Math.PI * 2,
    sp: 0.04 + rnd() * 0.12,
  }));

  const glitter = ['', '', ''];
  const rows = 54;
  for (let i = 0; i < rows; i++) {
    const f = i / (rows - 1);
    const y = shore + 5 + Math.pow(f, 1.3) * (H - shore - 8);
    const n = 1 + Math.floor(rnd() * 3);
    for (let m = 0; m < n; m++) {
      const w = (8 + rnd() * 40) * (0.4 + f * 1.8);
      const x = (rnd() - 0.5) * (14 + f * 220) - w / 2;
      const hh = (1.1 + f * 2.6).toFixed(1);
      glitter[(i + m) % 3] += `M${x.toFixed(1)},${y.toFixed(1)}h${w.toFixed(1)}v${hh}h-${w.toFixed(1)}Z`;
    }
  }

  let rays = '';
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + rnd() * 0.25;
    const hw = 0.012 + rnd() * 0.04;
    const L = 1.5 * W;
    rays += `M0,0L${(L * Math.cos(a - hw)).toFixed(0)},${(L * Math.sin(a - hw)).toFixed(0)}L${(L * Math.cos(a + hw)).toFixed(0)},${(L * Math.sin(a + hw)).toFixed(0)}Z`;
  }

  const fireflies: Firefly[] = Array.from({length: 42}, () => {
    const y = shore - 60 * sc + rnd() * (H - shore + 60 * sc) * 0.95;
    const depth = clamp((y - shore + 60) / (H - shore + 60));
    return {
      x: rnd() * W,
      y,
      r: (0.9 + rnd() * 0.9) * (0.7 + depth * 1.6),
      ph: rnd() * Math.PI * 2,
      sp: 0.03 + rnd() * 0.05,
      ax: 8 + rnd() * 26,
      ay: 5 + rnd() * 14,
    };
  });

  const reeds: {d: string; x: number; ph: number}[] = [];
  for (let i = 0; i < Math.round(W / 16); i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const u = Math.pow(rnd(), 1.7);
    const x = side < 0 ? u * W * 0.2 : W - u * W * 0.2;
    const len = (H - shore) * (0.25 + (1 - u) * 0.5 + rnd() * 0.15);
    const lean = -side * (6 + rnd() * 30);
    const b = 1.5 + rnd() * 1.8;
    reeds.push({
      d: `M${(x - b).toFixed(1)},${H + 4}Q${(x + lean * 0.3).toFixed(1)},${(H - len * 0.55).toFixed(1)} ${(x + lean).toFixed(1)},${(H - len).toFixed(1)}Q${(x + lean * 0.3 + b).toFixed(1)},${(H - len * 0.55).toFixed(1)} ${(x + b).toFixed(1)},${H + 4}Z`,
      x,
      ph: rnd() * Math.PI * 2,
    });
  }

  return {W, H, horizon, floor, shore, ridges, pines, shoreLine, stars, glitter, rays, fireflies, reeds};
};

export const circlePath = circle;
