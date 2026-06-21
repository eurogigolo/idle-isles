# Content Registry

This folder is the migration path toward generated content. The current game still keeps gameplay
definitions duplicated across TypeScript, Solidity, tests, and docs, but new ID work should be
recorded here first so collisions are visible during review.

Current status:

- `core/ids.json` is a checked registry for core area, item, and activity IDs.
- `npm run content:generate` generates `src/generated/contentIds.ts` for frontend chain mappings.
- `npm run content:check` validates namespace format, ID uniqueness, basic references, and
  generated output drift.
- The registry is not yet the source of local gameplay definitions or Solidity lookup output.

Next extraction steps:

1. Move local item and activity definitions into structured content data.
2. Generate `src/game.ts` maps from content data.
3. Generate contract test fixtures from the same IDs.
4. Generate compact Solidity lookup data for approved onchain content.
