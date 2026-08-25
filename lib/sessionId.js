// lib/sessionId.js
//
// Decodes a "MLTN;;;<base64-gzip-data>" session string (the format your
// reskinned pairing site generates) and writes the result into ./session
// so Baileys can pick it up via useMultiFileAuthState — no QR or pairing
// code needed if a valid SESSION_ID is provided.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const chalk = require('chalk');
const SESSION_DIR = path.join(__dirname, '..', 'session');
const HEADER = 'MLTN';
const SEPARATOR = ';;;';

function looksLikeFileMap(obj) {
    const keys = Object.keys(obj);
    if (keys.length === 0) return false;
    return keys.every(k => k.endsWith('.json'));
}

function importSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') return false;
    const trimmed = sessionId.trim();
    if (!trimmed) return false;
    const sepIndex = trimmed.indexOf(SEPARATOR);
    if (sepIndex === -1) {
        console.log(chalk.red(`❌ Invalid Sigil ID. Expected format: ${HEADER}${SEPARATOR}<data>`));
        return false;
    }
    const header = trimmed.slice(0, sepIndex);
    const b64data = trimmed.slice(sepIndex + SEPARATOR.length);
    if (header !== HEADER || !b64data) {
        console.log(chalk.red(`❌ Invalid Sigil ID. Expected header "${HEADER}", got "${header}".`));
        return false;
    }
    try {
        const compressed = Buffer.from(b64data, 'base64');
        const decompressed = zlib.gunzipSync(compressed);
        const parsed = JSON.parse(decompressed.toString('utf8'));
        if (!fs.existsSync(SESSION_DIR)) {
            fs.mkdirSync(SESSION_DIR, { recursive: true });
        }
        if (looksLikeFileMap(parsed)) {
            for (const [filename, content] of Object.entries(parsed)) {
                const filePath = path.join(SESSION_DIR, filename);
                const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
                fs.writeFileSync(filePath, fileContent, 'utf8');
            }
            console.log(chalk.green(`👑 Sigil ID bound successfully — ${Object.keys(parsed).length} shadow file(s) restored.`));
        } else {
            const credsPath = path.join(SESSION_DIR, 'creds.json');
            fs.writeFileSync(credsPath, JSON.stringify(parsed, null, 2), 'utf8');
            console.log(chalk.green(`👑 Sigil ID bound successfully — creds.json restored.`));
        }
        return true;
    } catch (error) {
        console.error(chalk.red('❌ The Sigil ID could not be decoded (corrupted or wrong format):'), error.message);
        return false;
    }
}

module.exports = { importSessionId };
