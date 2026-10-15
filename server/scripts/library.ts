// Downloads the logo library of kaankiziltug/logo-design-skill (MIT for its catalog; each logo is the trademark of
// its owner, for study only) into a folder this repository ignores, then takes the print of every logo, so that
// `proof` can say which ones an icon looks like. `pnpm --filter @netsuicon/server library`. Needs git.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { Library } from '../src/library';
import { logoPrint } from '../src/pictures';

const REPO = 'https://github.com/kaankiziltug/logo-design-skill';
/** The commit read and checked; another one may change the catalog. */
const COMMIT = '0ecf52e9a4b3ac92b714f7cc6e3148ab8c774134';
const INSIDE = 'skills/logo-design/assets/library';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(process.env.NETSUICON_LIBRARY ?? path.join(here, '../../library'));

function download(): void {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'netsuicon-library-'));
  const git = (...args: string[]): void => void execFileSync('git', args, { cwd: temp, stdio: 'inherit' });
  try {
    git('init', '-q');
    git('remote', 'add', 'origin', REPO);
    git('sparse-checkout', 'set', '--no-cone', `/${INSIDE}/`, '/LICENSE', '/TRADEMARKS.md');
    git('fetch', '-q', '--depth', '1', '--filter=blob:none', 'origin', COMMIT);
    git('checkout', '-q', 'FETCH_HEAD');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    fs.cpSync(path.join(temp, INSIDE, 'catalog.json'), path.join(dir, 'catalog.json'));
    fs.cpSync(path.join(temp, INSIDE, 'svg'), path.join(dir, 'svg'), { recursive: true });
    for (const notice of ['LICENSE', 'TRADEMARKS.md']) fs.cpSync(path.join(temp, notice), path.join(dir, notice));
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (!process.argv.includes('--prints-only')) download();
const library = new Library(dir);
const prints = new Map<string, Uint8Array>();
let failed = 0;
for (const logo of library.catalog()) {
  try {
    prints.set(logo.file, logoPrint(library.svg(logo.file)));
  } catch {
    failed += 1;
  }
}
library.writePrints(prints);
console.log(`${library.catalog().length} logos in ${dir}; ${prints.size} prints taken, ${failed} could not be drawn.`);
