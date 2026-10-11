// Recursive, scope-aware key and ICU validation for every supported locale.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditMessages } from './message-audit.mjs';
const report = auditMessages(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
if (process.argv.includes('--json')) console.log(JSON.stringify(report));
else if (report.errors.length) console.error(report.errors.join('\n'));
else console.log(`${report.messages} messages validated in ${report.locales} locales; nested keys, ICU arguments and translation call sites pass.`);
process.exitCode = report.errors.length ? 1 : 0;
