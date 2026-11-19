// Leonida Legends — the hand-in program for the GTA VI trophy guide entry.
// Node 22, standard library only. It copies the offline guide (app/) and its
// screenshots (screenshots/) from beside this file into the output directory,
// then writes /output/dossier.json with the vendored make.fun library, which
// the judge reads. vendor/makefun-frontend.ts is the kit's copy, unchanged.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The output directory is /output inside the grader, or MAKEFUN_OUTPUT_DIR
// when that variable is set.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The dossier caps are the scorer's own: the text budget shapes the bytes,
// and the other three refuse an entry the scorer would refuse — more than 4
// screenshots, one over 256 KiB, or app/ past 993 files / 48 MiB.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function fail(message) {
  throw new Error(`leonida-legends hand-in failed: ${message}`);
}

function checkTree(dir, label) {
  if (!existsSync(dir)) fail(`${label} is missing at ${dir}`);
  const entries = readdirSync(dir);
  if (entries.length === 0) fail(`${label} is empty`);
  for (const name of entries) {
    const path = join(dir, name);
    if (!statSync(path).isFile() && !statSync(path).isDirectory()) fail(`${label} holds a special file: ${name}`);
  }
}

function handIn() {
  const here = fileURLToPath(new URL('.', import.meta.url));
  const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  const appDir = join(here, 'app');
  const shotsDir = join(here, 'screenshots');

  checkTree(appDir, 'app/');
  checkTree(shotsDir, 'screenshots/');
  const shots = readdirSync(shotsDir).filter((n) => !n.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) fail(`screenshots/ holds ${shots.length} images, need 3 or 4`);
  for (const shot of shots) {
    if (statSync(join(shotsDir, shot)).size > 262144) fail(`screenshot ${shot} is over 256 KiB`);
  }

  mkdirSync(out, { recursive: true });
  cpSync(appDir, join(out, 'app'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

  const dossier = buildDossier(out, DOSSIER_CAPS);
  writeFileSync(join(out, 'dossier.json'), dossier);
  console.log(`leonida-legends: handed in ${shots.length} screenshots, dossier ${dossier.length} bytes`);
}

handIn();
