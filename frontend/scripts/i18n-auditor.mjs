import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const MESSAGES_FILE = path.join(SRC_DIR, 'messages', 'en.json');

const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const missingKeys = [];
const hardcodedTexts = [];

// Very basic parsing for demo/scripting purposes
walkDir(SRC_DIR, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Find namespaces used in the file
    const namespaceMatches = content.matchAll(/useTranslations\(['"]([^'"]+)['"]\)/g);
    let defaultNamespace = null;
    for (const match of namespaceMatches) {
        defaultNamespace = match[1]; // just take the last one or main one for simplicity
    }
    
    // Find t('key') or t("key") or t(`key`)
    const tMatches = content.matchAll(/t\(\s*['"`]([^'"`]+)['"`]\s*\)/g);
    for (const match of tMatches) {
        const key = match[1];
        if (key.includes('${')) continue; // Skip template literals with variables for now

        let ns = defaultNamespace;
        let actualKey = key;
        
        if (key.includes('.')) {
            const parts = key.split('.');
            ns = parts[0];
            actualKey = parts.slice(1).join('.');
        }

        if (ns && messages[ns]) {
            if (!messages[ns][actualKey]) {
                missingKeys.push({ file: path.relative(ROOT_DIR, filePath), namespace: ns, key: actualKey });
            }
        } else if (ns) {
            missingKeys.push({ file: path.relative(ROOT_DIR, filePath), namespace: ns, key: actualKey, error: 'Namespace missing' });
        }
    }

    // Find hardcoded text in JSX. Look for >Text< 
    // This regex looks for > followed by non-whitespace, letters, etc., followed by <
    // It's a heuristic but catches most plain text in JSX
    const hardcodedMatches = content.matchAll(/>\s*([^<>{]+?)\s*</g);
    for (const match of hardcodedMatches) {
        const text = match[1].trim();
        // filter out common non-text things like punctuation, numbers, single characters
        if (text.length > 2 && /[a-zA-Z]/.test(text) && !/^[0-9\s\-_.,!?:;]+$/.test(text)) {
            hardcodedTexts.push({ file: path.relative(ROOT_DIR, filePath), text });
        }
    }
});

const report = {
    missingKeys,
    hardcodedTexts
};

fs.writeFileSync(path.join(ROOT_DIR, 'i18n-report.json'), JSON.stringify(report, null, 2));
console.log('Report generated at i18n-report.json');
