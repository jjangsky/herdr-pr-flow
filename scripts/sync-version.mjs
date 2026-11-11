// Run by `npm version`: writes package.json's version into the mod, so the copy people
// install knows which release it is.
import { readFileSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const file = new URL('../mods/pr-flow/version.js', import.meta.url);
writeFileSync(file, readFileSync(file, 'utf8').replace(/VERSION = '[^']*'/, `VERSION = '${version}'`));
