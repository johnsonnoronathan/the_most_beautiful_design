// The valley engine shared by the Afterglow Studies pages: seeded ridgelines and
// stars, and the colour of the light at any hour. Same algorithms as the design
// canvas (canvas/*.dc.html), so a given seed draws the same mountains.
(function () {
  function rng(seed) {
    let a = seed | 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hex(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function mix(a, b, t) {
    const A = hex(a);
    const B = hex(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  /** 18 ridgelines from far (t = 0) to near (t = 1). `perK` divides frequency by the
      vertical scale, which the four-hours cards use to keep peaks in proportion. */
  function ridges(seed, W, H, horizon, floor, opts) {
    const o = Object.assign({step: 6, perK: false}, opts);
    const rnd = rng(seed);
    const k = (floor - horizon) / 440;
    const out = [];
    for (let i = 0; i < 18; i++) {
      const t = i / 17;
      const base = horizon + 6 + Math.pow(t, 1.7) * (floor - horizon);
      const amp = (36 - 26 * t + 150 * Math.pow(t, 1.25)) * k;
      const w = [];
      for (let j = 0; j < 5; j++) {
        const f = (0.0035 + rnd() * 0.004) * Math.pow(1.95, j);
        w.push({f: o.perK ? f / k : f, p: rnd() * 6.2832, a: Math.pow(0.5, j)});
      }
      const rp = rnd() * 6.2832;
      let d = 'M0,' + H;
      for (let x = 0; x <= W + o.step; x += o.step) {
        let v = 0;
        for (const q of w) v += q.a * Math.sin(x * q.f + q.p);
        v = v * 0.75 + (1 - Math.abs(Math.sin(x * w[0].f * 0.8 + rp))) * 0.6;
        d += 'L' + x + ',' + (base - amp * (v + 1) * 0.5).toFixed(1);
      }
      out.push({d: d + 'L' + (W + o.step) + ',' + H + 'Z', t, base});
    }
    return out;
  }

  /** Star field as `groups` path strings (so groups can twinkle out of step). */
  function stars(seed, W, maxY, count, groups, maxR, minR = 0.35) {
    const rnd = rng(seed * 31 + 7);
    const g = Array.from({length: groups}, () => '');
    for (let i = 0; i < count; i++) {
      const x = rnd() * W;
      const y = Math.pow(rnd(), 1.5) * maxY;
      const r = minR + Math.pow(rnd(), 3) * maxR;
      const rs = r.toFixed(2);
      const d = (2 * r).toFixed(2);
      g[i % groups] += 'M' + (x - r).toFixed(1) + ',' + y.toFixed(1) + 'a' + rs + ',' + rs + ' 0 1,0 ' + d + ',0a' + rs + ',' + rs + ' 0 1,0 -' + d + ',0';
    }
    return g;
  }

  const NIGHT = {skyTop: '#03040C', skyMid: '#0A1130', skyLow: '#16224A', horizon: '#25335E', far: '#283458', near: '#03050B', sun: '#FFB06A', starO: 1, glowO: 0};
  const KEYS = [
    Object.assign({h: 0}, NIGHT),
    {h: 4.6, skyTop: '#070B22', skyMid: '#1E2456', skyLow: '#5A4A84', horizon: '#C98A8E', far: '#4F4775', near: '#080A16', sun: '#FFB06A', starO: 0.7, glowO: 0.12},
    {h: 6, skyTop: '#2A3A78', skyMid: '#7F78B0', skyLow: '#F0A98C', horizon: '#FFD3A1', far: '#9C88AE', near: '#16152A', sun: '#FFC27A', starO: 0.08, glowO: 0.75},
    {h: 8.5, skyTop: '#3C78C4', skyMid: '#86B6E2', skyLow: '#CFE2F0', horizon: '#F6EAD6', far: '#A3B9CF', near: '#22323F', sun: '#FFF6E4', starO: 0, glowO: 0.45},
    {h: 12.5, skyTop: '#2762C4', skyMid: '#6FA8EA', skyLow: '#B8DAF6', horizon: '#E6F3FC', far: '#AFC6DB', near: '#1C3236', sun: '#FFFFFF', starO: 0, glowO: 0.35},
    {h: 16.5, skyTop: '#3767AE', skyMid: '#8FA6C8', skyLow: '#F1C38E', horizon: '#FFDCA4', far: '#C9A188', near: '#261C20', sun: '#FFD08A', starO: 0, glowO: 0.75},
    {h: 18, skyTop: '#1B2158', skyMid: '#6A4A86', skyLow: '#E9805E', horizon: '#FFB873', far: '#B66F86', near: '#120D1C', sun: '#FFB06A', starO: 0.05, glowO: 0.95},
    {h: 19.3, skyTop: '#0A0D2C', skyMid: '#33285A', skyLow: '#A2506A', horizon: '#F08A5D', far: '#9A5C7E', near: '#0A0814', sun: '#FFB06A', starO: 0.45, glowO: 0.5},
    {h: 20.8, skyTop: '#050822', skyMid: '#141C4A', skyLow: '#2F3A78', horizon: '#5B5E98', far: '#363C6C', near: '#05060F', sun: '#FFB06A', starO: 0.85, glowO: 0.08},
    Object.assign({h: 24}, NIGHT),
  ];
  const COLOURS = ['skyTop', 'skyMid', 'skyLow', 'horizon', 'far', 'near', 'sun'];

  function paletteAt(h) {
    let i = 0;
    while (i < KEYS.length - 2 && h > KEYS[i + 1].h) i++;
    const a = KEYS[i];
    const b = KEYS[i + 1];
    let t = Math.min(1, Math.max(0, (h - a.h) / (b.h - a.h)));
    t = t * t * (3 - 2 * t);
    const p = {};
    COLOURS.forEach((k) => (p[k] = mix(a[k], b[k], t)));
    p.starO = a.starO + (b.starO - a.starO) * t;
    p.glowO = a.glowO + (b.glowO - a.glowO) * t;
    return p;
  }

  const PHASES = [
    [4.5, 'Night', 'Stars, and the valley asleep.'],
    [5.8, 'First light', 'The sky pales before anything else does.'],
    [7, 'Sunrise', 'Light finds the far ridges first.'],
    [11, 'Morning', 'Mist lifts out of the low places.'],
    [14, 'Noon', 'Short shadows under the bluest sky.'],
    [16.2, 'Afternoon', 'Everything warms by a shade.'],
    [17.8, 'Golden hour', 'Low sun, long light, soft edges.'],
    [18.6, 'Sunset', 'The sun meets the ridgeline.'],
    [20.2, 'Afterglow', 'The sky keeps burning after the fire is out.'],
    [21.5, 'Blue hour', 'Cold light, and the first stars.'],
    [24.01, 'Night', 'Stars, and the valley asleep.'],
  ];

  function phaseAt(h) {
    for (const ph of PHASES) if (h < ph[0]) return {name: ph[1], note: ph[2]};
    return {name: 'Night', note: PHASES[0][2]};
  }

  /** Sun elevation, −1…1: rises at 06:00, sets at 18:00. */
  const elevation = (h) => Math.sin((Math.PI * (h - 6)) / 12);

  window.Valley = {rng, mix, ridges, stars, paletteAt, phaseAt, elevation};
})();
