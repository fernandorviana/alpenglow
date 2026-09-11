# Applying the Alpenglow variables in Figma

`alpenglow-variables.json` beside this file is generated from `src/tokens` by
`npx tsx scripts/export-figma.ts`. It is the only input: nothing here is typed
by hand, so the three Figma collections cannot drift from the two stylesheets.

Two ways to apply it. Either one ends with the same three collections.

## A — hand the prompt to an agent with the Figma MCP

Open the Alpenglow file, then give the agent this, with the JSON attached or
pasted:

> Read the attached `alpenglow-variables.json`. In the open Figma file, make the
> three variable collections it describes, in this order, one `use_figma` call
> per step, validating between steps:
>
> 1. **Alpenglow Primitives** — one mode, renamed `Value`. One COLOR variable
>    per entry in `variables`, value from `hex` (and `alpha` when present, as
>    the colour's `a`). Set `hiddenFromPublishing = true` on every one — it is
>    per variable and defaults to false. Scopes: all four fill/stroke/text
>    scopes; these are never picked directly.
> 2. **Alpenglow Theme** — modes `Light` then `Dark`, Light first (Figma treats
>    `modes[0]` as the default). One COLOR variable per entry, both modes set
>    with `createVariableAlias` to the primitive named in `alias.Light` /
>    `alias.Dark`. Never a raw colour. Set `scopes` from the entry and put
>    `description` on the variable.
> 3. **Alpenglow Scale** — one mode `Value`. FLOAT variables from `value`, with
>    the entry's `scopes`.
>
> If a collection with the same name already exists, update its variables in
> place by name — add what is missing, set every value, and delete variables
> whose names are no longer in the JSON — rather than creating a second
> collection. The old primitive families (`gray-light`, `gray-dark`, `brand-1`,
> `brand-2`, `red`, `green`, `yellow`, `blue`) are gone; every Theme alias
> must point at a primitive that exists in the JSON before the old ones are
> deleted, or the deletion will detach the alias.
>
> Verify by reading back the resolved hex of every Theme variable in both
> modes together with the primitive name it aliases — not hex alone, some
> values are shared — and report any mismatch against the JSON. Do not
> rebind nodes or retire paint styles: that is a separate, deliberate pass.

## B — run it yourself in a plugin console

The JSON is plain; this is the whole plugin. Paste the file's contents as
`DATA` and run it from a Figma plugin (Plugins → Development → New plugin →
Run once), or adapt it to `use_figma` step by step.

```js
const DATA = /* paste alpenglow-variables.json */;
const hex = (h, a) => {
  const c = { r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 };
  return a === undefined ? c : { ...c, a };
};
const ALL = ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR'];

async function collection(name, modes) {
  const existing = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === name);
  const col = existing ?? figma.variables.createVariableCollection(name);
  col.renameMode(col.modes[0].modeId, modes[0]);
  for (const m of modes.slice(1)) if (!col.modes.some((x) => x.name === m)) col.addMode(m);
  const ids = Object.fromEntries(col.modes.map((m) => [m.name, m.modeId]));
  const vars = await figma.variables.getLocalVariablesAsync();
  const byName = new Map(vars.filter((v) => v.variableCollectionId === col.id).map((v) => [v.name, v]));
  return { col, ids, byName };
}

// 1 — primitives
const prim = await collection('Alpenglow Primitives', ['Value']);
const primId = {};
for (const v of DATA.collections['Alpenglow Primitives'].variables) {
  const it = prim.byName.get(v.name) ?? figma.variables.createVariable(v.name, prim.col, 'COLOR');
  it.setValueForMode(prim.ids.Value, hex(v.hex, v.alpha));
  it.scopes = ALL;
  it.hiddenFromPublishing = true;
  primId[v.name] = it.id;
}

// 2 — theme, aliases only
const th = await collection('Alpenglow Theme', ['Light', 'Dark']);
for (const v of DATA.collections['Alpenglow Theme'].variables) {
  const it = th.byName.get(v.name) ?? figma.variables.createVariable(v.name, th.col, 'COLOR');
  for (const mode of ['Light', 'Dark']) {
    const target = await figma.variables.getVariableByIdAsync(primId[v.alias[mode]]);
    it.setValueForMode(th.ids[mode], figma.variables.createVariableAlias(target));
  }
  it.scopes = v.scopes;
  it.description = v.description;
}

// 3 — scale
const sc = await collection('Alpenglow Scale', ['Value']);
for (const v of DATA.collections['Alpenglow Scale'].variables) {
  const it = sc.byName.get(v.name) ?? figma.variables.createVariable(v.name, sc.col, 'FLOAT');
  it.setValueForMode(sc.ids.Value, v.value);
  it.scopes = v.scopes;
}

// 4 — retire primitives the JSON no longer names, now that no alias points at them
const keep = new Set(DATA.collections['Alpenglow Primitives'].variables.map((v) => v.name));
for (const [name, v] of prim.byName) if (!keep.has(name)) v.remove();

figma.notify('Alpenglow variables applied');
```

Step 4 is last on purpose: deleting a primitive before every alias has been
re-pointed detaches the alias, and Figma does not warn.

## What this does not do

- It does not rebind nodes. Components bound to the old primitives keep their
  old values until a rebinding pass; the Theme variables are the target of
  that pass, never the primitives.
- It does not touch paint styles, effect styles or text styles. Elevation stays
  an effect style — see `src/tokens/elevation.ts`.
- `color/surface/scrim` is an alpha alias in both modes. Figma colour
  variables carry alpha, so the alias is exact; the scrim's flattened value is
  a rendering, not a variable.
