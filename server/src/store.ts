import fs from 'node:fs';
import path from 'node:path';
import { IconError, resolve, validate, validatePack, type IconDoc, type Pack } from '@netsuicon/core';

const SUFFIX = '.nicon.json';
const PACK_FILE = 'pack.json';
const SETTINGS_FILE = 'settings.json';

/** The languages the app speaks. The first one is the one it starts in. */
export const LANGUAGES = ['en', 'fr'] as const;
export type Language = (typeof LANGUAGES)[number];
const NAME = /^[a-z0-9][a-z0-9-]*$/;

function saveJson(file: string, value: unknown): void {
  const draft = `${file}.tmp`;
  fs.writeFileSync(draft, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(draft, file);
}

/**
 * The folder of icons: one `<name>.nicon.json` per icon. A pack is a sub-folder with a `pack.json` and its
 * own icons. The only place that touches the disk.
 */
export class Store {
  constructor(readonly dir: string) {
    fs.mkdirSync(dir, { recursive: true });
  }

  private folder(pack: string | undefined): string {
    if (pack === undefined) return this.dir;
    if (!NAME.test(pack)) throw new IconError('bad_name', 'The name of a pack is lowercase letters, digits and dashes.');
    return path.join(this.dir, pack);
  }

  private file(name: string, pack: string | undefined): string {
    if (!NAME.test(name)) throw new IconError('bad_name', 'The name of an icon is lowercase letters, digits and dashes.');
    return path.join(this.folder(pack), name + SUFFIX);
  }

  packs(): string[] {
    return fs
      .readdirSync(this.dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && NAME.test(entry.name) && fs.existsSync(path.join(this.dir, entry.name, PACK_FILE)))
      .map((entry) => entry.name)
      .sort();
  }

  /** The packs that can be read, each with its icons; one that cannot is skipped, not fatal. */
  shelves(): { pack: Pack; icons: IconDoc[] }[] {
    return this.packs().flatMap((name) => {
      try {
        return [{ pack: this.readPack(name), icons: this.all(name) }];
      } catch {
        return [];
      }
    });
  }

  packExists(pack: string): boolean {
    return fs.existsSync(path.join(this.folder(pack), PACK_FILE));
  }

  readPack(pack: string): Pack {
    if (!this.packExists(pack)) throw new IconError('pack_not_found', `No pack named "${pack}". Existing: ${this.packs().join(', ') || 'none'}.`);
    const found = JSON.parse(fs.readFileSync(path.join(this.folder(pack), PACK_FILE), 'utf8')) as Pack;
    // A file changed by hand, or written by an older version: said as an error, not met later as a crash.
    validatePack(found);
    return found;
  }

  /** Saves the pack, unless one of its icons could no longer be drawn with it. */
  writePack(pack: Pack): void {
    validatePack(pack);
    const folder = this.folder(pack.name);
    for (const name of fs.existsSync(folder) ? this.names(pack.name) : []) {
      try {
        resolve(this.read(name, pack.name), pack);
      } catch (error) {
        if (error instanceof IconError) throw new IconError(error.code, `icon "${name}": ${error.message}`);
        throw error;
      }
    }
    fs.mkdirSync(folder, { recursive: true });
    saveJson(path.join(folder, PACK_FILE), pack);
  }

  names(pack?: string): string[] {
    return fs
      .readdirSync(this.folder(pack))
      .filter((entry) => entry.endsWith(SUFFIX))
      .map((entry) => entry.slice(0, -SUFFIX.length))
      .sort();
  }

  exists(name: string, pack?: string): boolean {
    return fs.existsSync(this.file(name, pack));
  }

  read(name: string, pack?: string): IconDoc {
    if (pack !== undefined) this.readPack(pack);
    const file = this.file(name, pack);
    if (!fs.existsSync(file)) {
      const place = pack === undefined ? 'outside the packs' : `in pack "${pack}"`;
      throw new IconError('icon_not_found', `No icon named "${name}" ${place}. Existing: ${this.names(pack).join(', ') || 'none'}.`);
    }
    return JSON.parse(fs.readFileSync(file, 'utf8')) as IconDoc;
  }

  /** The icon as it is drawn: with the style, the colours and the easing of its pack. */
  drawn(name: string, pack?: string): IconDoc {
    return resolve(this.read(name, pack), pack === undefined ? undefined : this.readPack(pack));
  }

  /** Icons that can be read and drawn; a file that cannot is skipped, not fatal. */
  all(pack?: string): IconDoc[] {
    const owner = pack === undefined ? undefined : this.readPack(pack);
    return this.names(pack).flatMap((name) => {
      try {
        const doc = this.read(name, pack);
        validate(doc);
        resolve(doc, owner);
        return [doc];
      } catch {
        return [];
      }
    });
  }

  /** Saves the icon, unless it is not valid or uses a colour its pack does not have. */
  write(doc: IconDoc, pack?: string): void {
    validate(doc);
    resolve(doc, pack === undefined ? undefined : this.readPack(pack));
    saveJson(this.file(doc.name, pack), doc);
  }

  /** The language the app shows its words in: the one that was chosen, or else English. */
  language(): Language {
    try {
      const { language } = JSON.parse(fs.readFileSync(path.join(this.dir, SETTINGS_FILE), 'utf8')) as { language?: Language };
      return language !== undefined && LANGUAGES.includes(language) ? language : LANGUAGES[0];
    } catch {
      return LANGUAGES[0];
    }
  }

  /** Chooses the language of the app, for the user and for the agent alike: there is one setting. */
  setLanguage(language: unknown): Language {
    const chosen = LANGUAGES.find((known) => known === language);
    if (chosen === undefined) throw new IconError('bad_language', `The app speaks ${LANGUAGES.join(' and ')}.`);
    saveJson(path.join(this.dir, SETTINGS_FILE), { language: chosen });
    return chosen;
  }

  /** Calls back, at most once per burst, when an icon, a pack or the language changes. Returns how to stop. */
  watch(onChange: () => void): () => void {
    let timer: NodeJS.Timeout | undefined;
    const watcher = fs.watch(this.dir, { recursive: true }, (_event, entry) => {
      const name = entry ? path.basename(entry) : undefined;
      if (entry && !entry.endsWith(SUFFIX) && name !== PACK_FILE && name !== SETTINGS_FILE) return;
      clearTimeout(timer);
      timer = setTimeout(onChange, 40);
    });
    return () => {
      clearTimeout(timer);
      watcher.close();
    };
  }
}
