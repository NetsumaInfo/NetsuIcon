import fs from 'node:fs';
import path from 'node:path';
import { IconError } from '@netsuicon/core';

/**
 * One logo of the library, as its catalog describes it. The library is the reference collection of
 * kaankiziltug/logo-design-skill: 1,432 real logos, each the trademark of its owner. It is studied, never copied,
 * and it is not part of this repository: `pnpm --filter @netsuicon/server library` downloads it.
 */
export interface Logo {
  file: string;
  brand: string;
  variant: string;
  aspect_class: string;
  n_colors: number;
  color_families: string[];
  primary_family: string;
  gradients: number;
  mark_type: string;
  symbol_type: string | null;
  subject: string | null;
  geometry: string[];
  techniques: string[];
  mood: string[];
  industry: string | null;
  exemplary: boolean;
  note: string | null;
}

const CATALOG = 'catalog.json';
const PRINTS = 'prints.json';
const FILE = /^[a-z0-9][a-z0-9._-]*\.svg$/i;

export const MISSING = 'The logo library is not downloaded. In the NetsuIcon folder, run: pnpm --filter @netsuicon/server library';

/** The folder of the library: `catalog.json`, `svg/`, and `prints.json`, the shape of each logo. The only other place that touches the disk. */
export class Library {
  private logos: Logo[] | undefined;
  private shapes: Map<string, Uint8Array> | undefined;

  constructor(readonly dir: string) {}

  ready(): boolean {
    return fs.existsSync(path.join(this.dir, CATALOG));
  }

  catalog(): Logo[] {
    if (!this.ready()) throw new IconError('no_library', MISSING);
    this.logos ??= JSON.parse(fs.readFileSync(path.join(this.dir, CATALOG), 'utf8')) as Logo[];
    return this.logos;
  }

  /** The SVG of one logo of the catalog. */
  svg(file: string): string {
    if (!FILE.test(file) || !this.catalog().some((logo) => logo.file === file)) {
      throw new IconError('logo_not_found', `No logo "${file}" in the library. search_library gives the names of files.`);
    }
    return fs.readFileSync(path.join(this.dir, 'svg', file), 'utf8');
  }

  /** The print of every logo, by file; empty until the prints are made. */
  prints(): Map<string, Uint8Array> {
    if (this.shapes) return this.shapes;
    const file = path.join(this.dir, PRINTS);
    const raw = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>) : {};
    this.shapes = new Map(Object.entries(raw).map(([name, print]) => [name, new Uint8Array(Buffer.from(print, 'base64'))]));
    return this.shapes;
  }

  writePrints(prints: Map<string, Uint8Array>): void {
    const out = Object.fromEntries([...prints].map(([name, print]) => [name, Buffer.from(print).toString('base64')]));
    fs.writeFileSync(path.join(this.dir, PRINTS), JSON.stringify(out));
    this.shapes = prints;
  }
}
