// OKLCH ramp generator + WCAG 2.x measurements for the Alpenglow bedrock proposal.
// Run: node ramps.mjs [json]

// ---- OKLCH -> sRGB ---------------------------------------------------------
function oklchToLinearSrgb(L, C, h) {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const inGamut = (rgb) => rgb.every((c) => c >= -1e-6 && c <= 1 + 1e-6);

/** Reduce chroma until the colour fits sRGB (keeps L and h). */
function toHex(L, C, h) {
  let lo = 0, hi = C, best = 0;
  if (inGamut(oklchToLinearSrgb(L, C, h))) best = C;
  else {
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinearSrgb(L, mid, h))) { best = mid; lo = mid; } else hi = mid;
    }
  }
  const rgb = oklchToLinearSrgb(L, best, h).map((c) => Math.min(1, Math.max(0, c)));
  const hex = '#' + rgb.map((c) => Math.round(gamma(c) * 255).toString(16).padStart(2, '0').toUpperCase()).join('');
  return { hex, clipped: best < C - 1e-6, C: best };
}

// ---- WCAG -----------------------------------------------------------------
function lum(hex) {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
export function contrast(a, b) {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// ---- Scale logic ---------------------------------------------------------------
// 12 stops. Lightness is shared by every family so a step means the same
// amount of light everywhere; chroma and hue are the family's own.
//
// 925 is the surface step, added 2026-09-12: the only stop that exists for
// surfaces rather than for text or fills. 950 → 925 → 900 is the dark
// elevation ladder, ΔL .043 per step in OKLCH, where the reference systems
// measured (Radix, Atlassian, Spectrum, Geist) sit at .025–.045. Without it
// the ladder had to jump a whole stop, ΔL .085, twice what any of them ship.
// It is generated in every family so a number keeps meaning the same amount
// of light everywhere; only night and stone are ever aliased at it.
export const STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 925, 950];
export const LIGHTNESS = {
  50: 0.975, 100: 0.945, 200: 0.895, 300: 0.825, 400: 0.73, 500: 0.625,
  600: 0.525, 700: 0.43, 800: 0.33, 900: 0.245, 925: 0.205, 950: 0.16,
};
/** Where 925 sits between 900 and 950, by lightness — used to interpolate chroma. */
const T925 = (LIGHTNESS[900] - LIGHTNESS[925]) / (LIGHTNESS[900] - LIGHTNESS[950]);
const with925 = (chroma) => ({ ...chroma, 925: chroma[900] + (chroma[950] - chroma[900]) * T925 });

// chroma: bell that peaks at 400–500 and thins at both ends; hue: gentle drift.
function bell(peak, ends, floorDark) {
  return with925({
    50: ends, 100: ends * 1.8, 200: peak * 0.55, 300: peak * 0.8, 400: peak * 0.95,
    500: peak, 600: peak * 0.95, 700: peak * 0.85, 800: peak * 0.72, 900: peak * 0.58,
    950: floorDark ?? peak * 0.45,
  });
}
const lerpHue = (a, b, t) => { let d = ((b - a + 540) % 360) - 180; return (a + d * t + 360) % 360; };
function drift(h50, h500, h950) {
  const out = {};
  STOPS.forEach((s) => {
    const t = s <= 500 ? (LIGHTNESS[50] - LIGHTNESS[s]) / (LIGHTNESS[50] - LIGHTNESS[500]) : 0;
    const u = s >= 500 ? (LIGHTNESS[500] - LIGHTNESS[s]) / (LIGHTNESS[500] - LIGHTNESS[950]) : 0;
    out[s] = s <= 500 ? lerpHue(h50, h500, t) : lerpHue(h500, h950, u);
  });
  return out;
}

export const FAMILIES = {
  // pink → coral → deep rose
  glow:     { chroma: bell(0.21, 0.025), hue: drift(352, 18, 12) },
  // lilac → violet → indigo
  twilight: { chroma: bell(0.23, 0.025), hue: drift(302, 292, 284) },
  // cool mineral grey; barely tinted, tint constant so the ramp reads as one stone
  stone:    { chroma: with925({ 50: 0.004, 100: 0.006, 200: 0.008, 300: 0.010, 400: 0.011, 500: 0.012, 600: 0.012, 700: 0.012, 800: 0.012, 900: 0.011, 950: 0.010 }), hue: drift(250, 258, 265) },
  // periwinkle → blue-violet night; darks keep chroma so the canvas is night, not grey
  night:    { chroma: with925({ 50: 0.012, 100: 0.02, 200: 0.035, 300: 0.05, 400: 0.065, 500: 0.075, 600: 0.075, 700: 0.07, 800: 0.06, 900: 0.05, 950: 0.042 }), hue: drift(268, 272, 278) },
  // fire on the mountain: the gold-orange the peaks take before they turn pink. Brand only, never status.
  flare:    { chroma: bell(0.21, 0.03), hue: drift(62, 48, 40) },
  // the cyan-teal of the twilight sky over the peaks (reference #069CB4 h214, #85C2C8 h204). Vivid where mist is a wash. Also the info status.
  glacier:  { chroma: bell(0.14, 0.03), hue: drift(200, 214, 220) },
  // cold pre-dawn light: a near-neutral with a cyan cast. Between stone (0.004–0.012) and night (0.012–0.075) in chroma.
  mist:     { chroma: with925({ 50: 0.010, 100: 0.016, 200: 0.024, 300: 0.032, 400: 0.038, 500: 0.042, 600: 0.040, 700: 0.036, 800: 0.031, 900: 0.026, 950: 0.021 }), hue: drift(200, 195, 198) },
  // status
  ember:    { chroma: bell(0.19, 0.025), hue: drift(20, 26, 22) },
  moss:     { chroma: bell(0.13, 0.02), hue: drift(150, 152, 155) },
  amber:    { chroma: bell(0.15, 0.03), hue: drift(95, 86, 76) },
};

export function build() {
  const out = {};
  for (const [name, f] of Object.entries(FAMILIES)) {
    out[name] = {};
    for (const s of f.stops ?? STOPS) {
      const { hex, clipped, C } = toHex(LIGHTNESS[s], f.chroma[s], f.hue[s]);
      out[name][s] = { hex, L: LIGHTNESS[s], C: +C.toFixed(3), h: +f.hue[s].toFixed(0), clipped };
    }
  }
  return out;
}

// ---- Measurements -------------------------------------------------------------
const P = build();
const c = (fam, s) => P[fam][s].hex;
const WHITE = '#FFFFFF';

const pairs = [
  // ---- LIGHT ----
  ['L text/primary  stone.900 on white', 'stone', 900, WHITE, 4.5],
  ['L text/primary  stone.900 on stone.50', 'stone', 900, c('stone', 50), 4.5],
  ['L text/primary  stone.900 on stone.100', 'stone', 900, c('stone', 100), 4.5],
  ['L text/secondary stone.700 on white', 'stone', 700, WHITE, 4.5],
  ['L text/secondary stone.700 on stone.100', 'stone', 700, c('stone', 100), 4.5],
  ['L text/tertiary stone.600 on white', 'stone', 600, WHITE, 4.5],
  ['L text/tertiary stone.600 on stone.100', 'stone', 600, c('stone', 100), 4.5],
  ['L text/placeholder stone.600 on white', 'stone', 600, WHITE, 4.5],
  ['L border/strong stone.500 on white', 'stone', 500, WHITE, 3],
  ['L border/strong stone.500 on stone.100', 'stone', 500, c('stone', 100), 3],
  ['L border/default stone.300 on white (decorative)', 'stone', 300, WHITE, 0],
  ['L action/primary twilight.600 + white label', 'twilight', 600, WHITE, 4.5],
  ['L action/primary-hover twilight.700 + white', 'twilight', 700, WHITE, 4.5],
  ['L action/primary-pressed twilight.800 + white', 'twilight', 800, WHITE, 4.5],
  ['L text/link twilight.600 on white', 'twilight', 600, WHITE, 4.5],
  ['L text/link twilight.600 on stone.50', 'twilight', 600, c('stone', 50), 4.5],
  ['L text/link twilight.600 on twilight.50', 'twilight', 600, c('twilight', 50), 4.5],
  ['L focus ring twilight.500 on white', 'twilight', 500, WHITE, 3],
  ['L focus ring twilight.500 on stone.50', 'twilight', 500, c('stone', 50), 3],
  ['L focus ring twilight.500 on stone.100', 'twilight', 500, c('stone', 100), 3],
  ['L glow text glow.700 on white', 'glow', 700, WHITE, 4.5],
  ['L glow text glow.700 on glow.50', 'glow', 700, c('glow', 50), 4.5],
  ['L glow fill glow.600 + white label', 'glow', 600, WHITE, 4.5],
  ['L glow fill glow.500 + white label (informational)', 'glow', 500, WHITE, 0],
  ['L glow icon/border glow.500 on white', 'glow', 500, WHITE, 3],
  ['L info text night.700 on white', 'night', 700, WHITE, 4.5],
  ['L info text night.700 on night.50', 'night', 700, c('night', 50), 4.5],
  ['L error text ember.700 on white', 'ember', 700, WHITE, 4.5],
  ['L error text ember.700 on ember.50', 'ember', 700, c('ember', 50), 4.5],
  ['L error border ember.600 on white', 'ember', 600, WHITE, 3],
  ['L error fill ember.600 + white', 'ember', 600, WHITE, 4.5],
  ['L success text moss.700 on white', 'moss', 700, WHITE, 4.5],
  ['L success text moss.700 on moss.50', 'moss', 700, c('moss', 50), 4.5],
  ['L success border moss.600 on white', 'moss', 600, WHITE, 3],
  ['L warning text amber.800 on white', 'amber', 800, WHITE, 4.5],
  ['L warning text amber.800 on amber.50', 'amber', 800, c('amber', 50), 4.5],
  ['L warning border amber.600 on white', 'amber', 600, WHITE, 3],
  ['L flare fill flare.400 + stone.900 label', 'stone', 900, c('flare', 400), 4.5],
  ['L flare hover flare.300 + stone.900 label', 'stone', 900, c('flare', 300), 4.5],
  ['L flare pressed flare.200 + stone.900 label', 'stone', 900, c('flare', 200), 4.5],
  ['L flare fill flare.500 + stone.900 (why 500 is not a fill)', 'stone', 900, c('flare', 500), 0],
  ['L flare fill flare.500 + white (same)', 'flare', 500, WHITE, 0],
  ['L flare solid flare.600 + white label', 'flare', 600, WHITE, 4.5],
  ['L flare text flare.700 on white', 'flare', 700, WHITE, 4.5],
  ['L flare text flare.700 on flare.50', 'flare', 700, c('flare', 50), 4.5],
  ['L flare border/icon flare.500 on white', 'flare', 500, WHITE, 3],
  ['L flare.400 vs amber.400 (collision)', 'flare', 400, c('amber', 400), 0],
  ['L flare.500 vs ember.500 (collision)', 'flare', 500, c('ember', 500), 0],
  ['L glacier fill glacier.600 + white label', 'glacier', 600, WHITE, 4.5],
  ['L glacier text glacier.700 on white', 'glacier', 700, WHITE, 4.5],
  ['L glacier text glacier.700 on glacier.50', 'glacier', 700, c('glacier', 50), 4.5],
  ['L glacier border/icon glacier.500 on white', 'glacier', 500, WHITE, 3],
  ['L glacier fill glacier.400 + stone.900 label', 'stone', 900, c('glacier', 400), 4.5],
  ['L glacier.600 vs moss.600 (separation)', 'glacier', 600, c('moss', 600), 0],
  ['L glacier.500 vs mist.500 (separation)', 'glacier', 500, c('mist', 500), 0],
  ['L glacier.600 vs twilight.600 (separation)', 'glacier', 600, c('twilight', 600), 0],
  ['L mist hover: text/primary stone.900 on mist.100', 'stone', 900, c('mist', 100), 4.5],
  ['L mist selected: stone.900 on mist.200', 'stone', 900, c('mist', 200), 4.5],
  ['L link twilight.600 on mist.200 (why link-on-selected exists)', 'twilight', 600, c('mist', 200), 0],
  ['L link-on-selected twilight.700 on mist.200', 'twilight', 700, c('mist', 200), 4.5],
  ['L mist border mist.400 on white (decorative)', 'mist', 400, WHITE, 0],
  ['L mist soft focus ring mist.500 on white', 'mist', 500, WHITE, 3],
  ['L mist soft focus ring mist.500 on stone.100 (known limit)', 'mist', 500, c('stone', 100), 0],
  ['L mist icon mist.600 on white', 'mist', 600, WHITE, 4.5],
  ['L mist text mist.700 on white', 'mist', 700, WHITE, 4.5],
  ['L mist text mist.700 on mist.100', 'mist', 700, c('mist', 100), 4.5],
  ['L mist text mist.800 on mist.200', 'mist', 800, c('mist', 200), 4.5],
  ['L mist.100 vs white (perceptible?)', 'mist', 100, WHITE, 0],
  ['L mist.100 vs stone.100 (cast visible?)', 'mist', 100, c('stone', 100), 0],
  ['L glow.500 vs ember.500 (collision)', 'glow', 500, c('ember', 500), 0],
  ['L glow.600 vs ember.600 (collision)', 'glow', 600, c('ember', 600), 0],
  // ---- DARK ----
  ['D text/primary stone.50 on night.950', 'stone', 50, c('night', 950), 4.5],
  ['D text/primary stone.50 on night.800', 'stone', 50, c('night', 800), 4.5],
  ['D text/secondary stone.300 on night.950', 'stone', 300, c('night', 950), 4.5],
  ['D text/secondary stone.300 on night.800', 'stone', 300, c('night', 800), 4.5],
  ['D text/tertiary stone.400 on night.950', 'stone', 400, c('night', 950), 4.5],
  ['D text/tertiary stone.400 on night.800', 'stone', 400, c('night', 800), 4.5],
  ['D text/placeholder stone.400 on night.800', 'stone', 400, c('night', 800), 4.5],
  ['D text/secondary stone.300 vs tertiary stone.400 (separation)', 'stone', 300, c('stone', 400), 0],
  ['D text/placeholder stone.400 on night.900', 'stone', 400, c('night', 900), 4.5],
  ['D border/strong stone.500 on night.950', 'stone', 500, c('night', 950), 3],
  ['D border/strong stone.500 on night.800', 'stone', 500, c('night', 800), 3],
  ['D border/strong stone.500 on night.900', 'stone', 500, c('night', 900), 3],
  ['D border/default night.700 on night.950', 'night', 700, c('night', 950), 0],
  ['D surface step night.950 vs night.900', 'night', 950, c('night', 900), 0],
  ['D surface step night.900 vs night.800', 'night', 900, c('night', 800), 0],
  ['D action/primary twilight.400 + night.950 label', 'twilight', 400, c('night', 950), 4.5],
  ['D action/primary-hover twilight.300 + night.950', 'twilight', 300, c('night', 950), 4.5],
  ['D action/primary-pressed twilight.200 + night.950', 'twilight', 200, c('night', 950), 4.5],
  ['D text/link twilight.300 on night.950', 'twilight', 300, c('night', 950), 4.5],
  ['D text/link twilight.300 on night.800', 'twilight', 300, c('night', 800), 4.5],
  ['D text/link twilight.300 on twilight.900', 'twilight', 300, c('twilight', 900), 4.5],
  ['D focus ring twilight.300 on night.950', 'twilight', 300, c('night', 950), 3],
  ['D focus ring twilight.300 on night.800', 'twilight', 300, c('night', 800), 3],
  ['D focus ring twilight.300 vs fill twilight.400', 'twilight', 300, c('twilight', 400), 0],
  ['D glow text glow.300 on night.950', 'glow', 300, c('night', 950), 4.5],
  ['D glow text glow.300 on glow.900', 'glow', 300, c('glow', 900), 4.5],
  ['D glow fill glow.400 + night.950 label', 'glow', 400, c('night', 950), 4.5],
  ['D info text night.300 on night.950', 'night', 300, c('night', 950), 4.5],
  ['D error text ember.300 on night.950', 'ember', 300, c('night', 950), 4.5],
  ['D error text ember.300 on ember.900', 'ember', 300, c('ember', 900), 4.5],
  ['D error border ember.400 on night.950', 'ember', 400, c('night', 950), 3],
  ['D error border ember.400 on night.800', 'ember', 400, c('night', 800), 3],
  ['D success text moss.300 on night.950', 'moss', 300, c('night', 950), 4.5],
  ['D success text moss.300 on moss.900', 'moss', 300, c('moss', 900), 4.5],
  ['D warning text amber.300 on night.950', 'amber', 300, c('night', 950), 4.5],
  ['D warning text amber.300 on amber.900', 'amber', 300, c('amber', 900), 4.5],
  ['D flare fill flare.400 + night.950 label', 'flare', 400, c('night', 950), 4.5],
  ['D flare hover flare.300 + night.950', 'flare', 300, c('night', 950), 4.5],
  ['D flare pressed flare.200 + night.950', 'flare', 200, c('night', 950), 4.5],
  ['D flare text flare.300 on night.950', 'flare', 300, c('night', 950), 4.5],
  ['D flare text flare.300 on flare.900', 'flare', 300, c('flare', 900), 4.5],
  ['D flare border flare.400 on night.800', 'flare', 400, c('night', 800), 3],
  ['D glacier fill glacier.400 + night.950 label', 'glacier', 400, c('night', 950), 4.5],
  ['D glacier text glacier.300 on night.950', 'glacier', 300, c('night', 950), 4.5],
  ['D glacier text glacier.300 on glacier.900', 'glacier', 300, c('glacier', 900), 4.5],
  ['D glacier border glacier.400 on night.800', 'glacier', 400, c('night', 800), 3],
  ['D glacier.900 vs night.900 (subtle bg visible?)', 'glacier', 900, c('night', 900), 0],
  ['D mist text mist.300 on night.950', 'mist', 300, c('night', 950), 4.5],
  ['D mist text mist.300 on mist.900', 'mist', 300, c('mist', 900), 4.5],
  ['D mist icon mist.400 on night.800', 'mist', 400, c('night', 800), 3],
  ['D mist soft focus ring mist.400 on night.950', 'mist', 400, c('night', 950), 3],
  ['D link twilight.300 on mist.900', 'twilight', 300, c('mist', 900), 4.5],
  ['D mist selected: stone.50 on mist.900', 'stone', 50, c('mist', 900), 4.5],
  ['D mist.900 vs night.950 (selected visible?)', 'mist', 900, c('night', 950), 0],
  ['D glow.300 vs ember.300 (collision)', 'glow', 300, c('ember', 300), 0],
];

if (process.argv[2] === 'json') {
  console.log(JSON.stringify(P, null, 1));
} else {
  for (const [name, f] of Object.entries(P)) {
    console.log(`\n${name}`);
    for (const [s, v] of Object.entries(f)) {
      console.log(`  ${s.padStart(3)}  ${v.hex}  L${v.L.toFixed(3)} C${v.C.toFixed(3)} h${v.h}${v.clipped ? '  (clipped)' : ''}  vs white ${contrast(v.hex, WHITE).toFixed(2)}  vs night950 ${contrast(v.hex, P.night[950].hex).toFixed(2)}`);
    }
  }
  console.log('\nPAIRS');
  let fails = 0;
  for (const [label, fam, s, bg, min] of pairs) {
    const r = contrast(c(fam, s), bg);
    const ok = min === 0 ? ' ' : r >= min ? 'ok' : 'FAIL';
    if (ok === 'FAIL') fails++;
    console.log(`  ${ok.padEnd(4)} ${r.toFixed(2).padStart(6)}  ${label}`);
  }
  console.log(`\n${fails} failures`);
}
