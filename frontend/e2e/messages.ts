import { readFileSync } from 'node:fs';

export const messages = {
  en: JSON.parse(readFileSync(new URL('../src/messages/en.json', import.meta.url), 'utf8')),
  ar: JSON.parse(readFileSync(new URL('../src/messages/ar.json', import.meta.url), 'utf8')),
};
