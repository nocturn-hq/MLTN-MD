// lib/mongoSession.js
// Persists the Baileys ./session folder to MongoDB so it survives
// Render restarts/redeploys (Render's disk is NOT persistent).
//
// Set MONGODB_URI as an environment variable on Render (or in settings.js
// as `settings.mongodbUri`) — e.g.:
//   mongodb+srv://user:pass@cluster.mongodb.net/mltn-md?retryWrites=true&w=majority

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

let settings = {};
try { settings = require('../settings'); } catch (_) {}

const MONGODB_URI = process.env.MONGODB_URI || settings.mongodbUri || '';
const DB_NAME = process.env.MONGODB_DB_NAME || 'mltn_md';
const COLLECTION_NAME = 'shadow_session';
const SESSION_DIR = path.join(process.cwd(), 'session');

let client = null;
let collectionPromise = null;

async function getCollection() {
    if (!MONGODB_URI) return null;
    if (collectionPromise) return collectionPromise;

    collectionPromise = (async () => {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('👑 Bound to the Shadow Archive (MongoDB connected).');
        return client.db(DB_NAME).collection(COLLECTION_NAME);
    })();

    return collectionPromise;
}

// Pull every saved session file down from MongoDB into ./session.
// Call this BEFORE useMultiFileAuthState so Baileys sees the restored creds.
async function restoreSession() {
    try {
        const col = await getCollection();
        if (!col) {
            console.log('⚠️ No MONGODB_URI configured — session will NOT survive a restart.');
            return;
        }

        if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

        const docs = await col.find({}).toArray();
        if (!docs.length) {
            console.log('⛧ No prior session found in the Shadow Archive. A fresh binding is needed.');
            return;
        }

        for (const doc of docs) {
            const filePath = path.join(SESSION_DIR, doc.filename);
            fs.writeFileSync(filePath, Buffer.from(doc.data, 'base64'));
        }
        console.log(`⛧ Restored ${docs.length} session file(s) from the Shadow Archive.`);
    } catch (err) {
        console.error('☠️ Failed to restore session from MongoDB:', err.message);
    }
}

// Push every file currently in ./session up into MongoDB.
// Call this every time creds.update fires.
async function backupSession() {
    try {
        const col = await getCollection();
        if (!col) return;
        if (!fs.existsSync(SESSION_DIR)) return;

        const files = fs.readdirSync(SESSION_DIR)
            .filter(f => fs.statSync(path.join(SESSION_DIR, f)).isFile());

        for (const filename of files) {
            const data = fs.readFileSync(path.join(SESSION_DIR, filename)).toString('base64');
            await col.updateOne(
                { filename },
                { $set: { filename, data, updatedAt: new Date() } },
                { upsert: true }
            );
        }
    } catch (err) {
        console.error('☠️ Failed to back up session to MongoDB:', err.message);
    }
}

// Wipe the archive — call alongside local session deletion on logout,
// so a banished session doesn't get restored again on next boot.
async function clearSession() {
    try {
        const col = await getCollection();
        if (!col) return;
        await col.deleteMany({});
        console.log('🩸 The Shadow Archive has been purged.');
    } catch (err) {
        console.error('☠️ Failed to purge MongoDB session:', err.message);
    }
}

module.exports = { restoreSession, backupSession, clearSession };