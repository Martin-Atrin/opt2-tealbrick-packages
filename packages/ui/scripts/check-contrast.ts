/* check-contrast.ts (derived from the design lead's tools/check-contrast.ts; only the import path differs) — static WCAG check of every text/background and edge/background pair the kit defines,
   in light and dark. Reads tokens.ts (resolved + resolvedDark). Exit 1 on any failure.
   Run: node scripts/check-contrast.ts [--json]
   AA: 4.5 text, 3.0 large text (>=24px, or >=18.66px at 700+), 3.0 UI edges and focus rings (WCAG 1.4.11).
   The rendered check (gallery page, every state, open Selects, ink centring) is scripts/check-rendered.ts. */
import { resolved, resolvedDark, type TokenName } from '../src/tokens.ts';

type RGB = [number, number, number];
const hex = (v: string): RGB => {
  const m = /^#([0-9a-f]{6})$/i.exec(v.trim());
  if (!m) throw new Error(`not a hex colour: ${v}`);
  return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)) as RGB;
};
const over = (fg: RGB, a: number, bg: RGB): RGB => fg.map((c, i) => c * a + bg[i] * (1 - a)) as RGB;
const lum = ([r, g, b]: RGB) => { const f = (c: number) => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
const ratio = (a: RGB, b: RGB) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };

/** [what, fg token, bg token | "transparent@<ground>", kind, fg alpha] */
type Pair = [string, TokenName, string, 'text' | 'large' | 'ui', number?];
const grounds: TokenName[] = ['paper', 'tile', 'film', 'plate'];
const P: Pair[] = [];
// reading text on every ground
for (const g of grounds) for (const fg of ['ink', 'inkRead', 'inkSoft', 'muted', 'tealInk', 'brickInk', 'link', 'focus'] as TokenName[]) P.push([`${fg} on ${g}`, fg, g, fg === 'focus' ? 'ui' : 'text']);
// state pairs: fill + on (transparent fills are checked over paper and tile)
const states: [string, TokenName, TokenName][] = [
  ['primary', 'primaryOn', 'primaryFill'], ['primary hover', 'primaryHoverOn', 'primaryHoverFill'], ['primary active', 'primaryActiveOn', 'primaryActiveFill'],
  ['secondary hover', 'secondaryHoverOn', 'secondaryHoverFill'], ['secondary active', 'secondaryActiveOn', 'secondaryActiveFill'],
  ['quiet hover', 'quietHoverOn', 'quietHoverFill'], ['quiet active', 'quietActiveOn', 'quietActiveFill'],
  ['danger hover', 'dangerHoverOn', 'dangerHoverFill'], ['danger confirm', 'dangerConfirmOn', 'dangerConfirmFill'], ['danger confirm hover', 'dangerConfirmHoverOn', 'dangerConfirmHoverFill'],
  ['disabled', 'disabledOn', 'disabledFill'],
  ['tab hover', 'tabHoverOn', 'tabHoverFill'], ['tab current', 'tabCurrentOn', 'tabCurrentFill'], ['tab current hover', 'tabCurrentHoverOn', 'tabCurrentHoverFill'],
  ['field', 'fieldOn', 'fieldFill'], ['field placeholder', 'fieldPlaceholder', 'fieldFill'],
  ['option', 'optionOn', 'optionFill'], ['option hover/active', 'optionHoverOn', 'optionHoverFill'], ['option selected', 'optionSelectedOn', 'optionSelectedFill'],
  ['option selected hover', 'optionSelectedHoverOn', 'optionSelectedHoverFill'], ['option disabled', 'optionDisabledOn', 'optionFill'],
  ['status live', 'statusLiveOn', 'statusLiveFill'], ['status busy', 'statusBusyOn', 'statusBusyFill'], ['status needs you', 'statusNeedsYouOn', 'statusNeedsYouFill'], ['status idle', 'statusIdleOn', 'statusIdleFill'],
  ['count', 'countOn', 'countFill'], ['on-brick on brick-ink', 'onBrick', 'brickInk'],
];
for (const [n, fg, bg] of states) P.push([n, fg, bg, 'text']);
for (const g of ['paper', 'tile'] as TokenName[]) for (const [n, fg] of [['secondary', 'secondaryOn'], ['quiet', 'quietOn'], ['danger', 'dangerOn'], ['tab', 'tabOn']] as [string, TokenName][]) P.push([`${n} (transparent) on ${g}`, fg, g, 'text']);
// UI edges (3:1) against the ground they sit on and the fill inside them
for (const g of ['paper', 'tile', 'plate'] as TokenName[]) for (const e of ['fieldEdge', 'quietEdge', 'tabEdge', 'secondaryEdge', 'dangerEdge', 'focus', 'fieldInvalidEdge'] as TokenName[]) P.push([`${e} edge vs ${g}`, e, g, 'ui']);
P.push(['field edge vs field fill', 'fieldEdge', 'fieldFill', 'ui'], ['focus ring vs film (canvas)', 'focus', 'film', 'ui'], ['focus ring vs teal-wash', 'focus', 'tealWash', 'ui'], ['teal wire vs film', 'wireLive', 'film', 'ui'], ['brick wire vs film', 'brick', 'film', 'ui']);
// scrollbars: thumb (all states) vs every surface it can sit on
for (const g of ['paper', 'tile', 'plate', 'film'] as TokenName[]) for (const th of ['scrollThumb', 'scrollThumbHover', 'scrollThumbActive'] as TokenName[]) P.push([`${th} vs ${g}`, th, g, 'ui']);
// app header colours (C139): white text on every --tb-app-* (same token in both themes)
for (const k of Object.keys(resolved) as TokenName[]) if (/^app[A-Z]/.test(k) && k !== 'appOn') P.push([`white on ${k}`, 'appOn', k, 'text']);
// StepFlow: upcoming steps are ink at 62% over the dialog tile (semi-transparent, C126)
P.push(['stepflow upcoming (ink 62%) on tile', 'ink', 'tile', 'text', .62], ['stepflow done (teal-ink) on tile', 'tealInk', 'tile', 'text']);
// tone inks are light-only text (dark falls back to teal-ink in components.css)
const lightOnly: Pair[] = (['toneStoneInk', 'toneWoodInk', 'toneMossInk', 'toneTealInk', 'toneBrickInk'] as TokenName[]).map(t => [`${t} on tile`, t, 'tile', 'text'] as Pair);

const run = (theme: 'light' | 'dark', map: Record<TokenName, string>, pairs: Pair[]) => pairs.map(([what, fgT, bgT, kind, a = 1]) => {
  const bg = hex(map[bgT as TokenName]);
  const fg = over(hex(map[fgT]), a, bg);
  const r = ratio(fg, bg);
  const need = kind === 'text' ? 4.5 : 3;
  return { theme, what, fg: map[fgT], bg: map[bgT as TokenName], ratio: Math.round(r * 100) / 100, need, ok: r >= need };
});
const results = [...run('light', resolved, [...P, ...lightOnly]), ...run('dark', resolvedDark, P)];
const fails = results.filter(r => !r.ok);
if (process.argv.includes('--json')) console.log(JSON.stringify({ checked: results.length, failures: fails }, null, 2));
else {
  for (const f of fails) console.error(`FAIL ${f.theme} ${f.what}: ${f.fg} on ${f.bg} = ${f.ratio} (needs ${f.need})`);
  const min = results.reduce((m, r) => r.ratio < m.ratio ? r : m);
  console.log(`check-contrast: ${results.length} token pairs (light + dark), ${fails.length} failures; lowest ${min.ratio} (${min.theme} ${min.what}, needs ${min.need})`);
}
process.exit(fails.length ? 1 : 0);
