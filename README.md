# Leonida Legends — GTA VI Trophy Guide & Tracker

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun rank](https://make.fun/badge/gta6-trophy-guide-01/Richkys1/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun reward](https://make.fun/badge/gta6-trophy-guide-01/Richkys1/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI — 1 platinum, 2 gold, 6 silver, 46 bronze — with a full guide in our own words for every trophy, a roadmap to the platinum, missable flags, and a checklist that saves your progress in the browser.

## What it does

- **Every trophy, with a guide**: official name, description and grade for all 55 trophies, each with a 3–6 sentence guide (what to do, where and how, when it can be missed) and a named source beside it. Sources are the official PlayStation trophy list as published 2026-11-18 (via Exophase and PSNProfiles) and the PowerPyx trophy guide & roadmap.
- **Checklist that remembers**: tick trophies off as you earn them; progress is saved in localStorage, and can be exported to a JSON file and imported back.
- **Filters**: by kind (Story / Missable / Collectibles / Activities), by grade, by search text, and an earned-only view.
- **Spoiler-safe mode**: hides the names and descriptions of story trophies until you have earned them.
- **Roadmap to the platinum**: Phase 1, the story (Chapters 1–4, then the final mission); Phase 2, activities and collectibles alongside the story; Phase 3, the post-game cleanup to 100% completion and the platinum.
- **Detail view**: open any trophy for its full guide and source.
- **Offline**: static files under `app/`, no build step, no network requests at runtime, system fonts only, and a look of its own — no Rockstar logo or artwork.

## How to run

```sh
node serve.ts
```

Then open http://localhost:8080. Or serve `app/` with any static file server.

URL parameters for deep links: `?view=roadmap`, `?trophy=17`, `?spoiler=on`, `?grade=silver`.

## How the dossier is built

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshots

Four real renders of the app in headless Chromium, 1280×800 JPEGs, in `screenshots/` (see `shots.json` for the views): the checklist, the roadmap, a trophy's full guide, and spoiler-safe mode.

Entered on [make.fun](https://make.fun/?ref=xmc7n7gx&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01).
