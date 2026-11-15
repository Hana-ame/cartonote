# CartoNote — Infinite Map & Spatial Note Canvas

An infinite, draggable cartographic canvas for spatial note-taking — pin waypoints, link routes across sectors, and explore a visual knowledge atlas.

**Live demo:** https://hana-ame.github.io/cartonote/

## Run Locally

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build into dist/
```

The app is fully client-side (no backend, no API key required); notes are persisted in `localStorage`.

## Deploy to GitHub Pages

Deployment is fully handled by GitHub Actions — nothing is built locally.

- Workflow: `.github/workflows/deploy.yml` (`Build` → `Deploy`)
- Trigger: every push to `main`, or manually from the **Actions** tab (`workflow_dispatch`)
- Pages source: **GitHub Actions** (not a branch), so no `gh-pages` branch is maintained

To publish an update, just push:

```bash
git add -A && git commit -m "your change" && git push origin main
```

The workflow installs dependencies with `npm ci`, builds with Vite, adds `dist/.nojekyll`,
uploads the `dist` folder as a Pages artifact and deploys it. `vite.config.ts` sets
`base: './'`, so the same build works from the `/cartonote/` sub-path.

## Structure

- `src/App.tsx` — canvas state, viewport pan/zoom, note & route model
- `src/components/` — sidebar, note cards, tool dock, minimap radar, modals
- `src/utils/canvasMath.ts` — coordinate/screen transforms (with tests)
- `src/data/seedAtlas.ts` — demo atlas content
