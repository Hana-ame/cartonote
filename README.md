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

The site is served from the `gh-pages` branch (project site under `/cartonote/`).
`vite.config.ts` sets `base: './'`, so the build works from any sub-path.

To publish an update:

```bash
./deploy.sh "your commit message"
```

Or manually:

```bash
npm run build
rm -rf .pages-tmp && mkdir .pages-tmp && cp -r dist/. .pages-tmp/
touch .pages-tmp/.nojekyll
cd .pages-tmp && git init -b gh-pages && git add -A && git commit -m "Deploy"
git remote add origin https://github.com/Hana-ame/cartonote.git
git push -f origin gh-pages
```

`.nojekyll` is required so GitHub Pages serves the `assets/` directory verbatim.

## Structure

- `src/App.tsx` — canvas state, viewport pan/zoom, note & route model
- `src/components/` — sidebar, note cards, tool dock, minimap radar, modals
- `src/utils/canvasMath.ts` — coordinate/screen transforms (with tests)
- `src/data/seedAtlas.ts` — demo atlas content
