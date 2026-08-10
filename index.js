/**
 * MLTN-MD - Shadow Monarch Edition
 * "Arise." — A WhatsApp Bot forged in the Shadow Realm
 * Reskinned by MILITAN, based on Knight Bot by Professor
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 * 
 * Credits:
 * - Baileys Library by @adiwajshing
 * - Pair Code implementation inspired by TechGod143 & DGXEON
 */
require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
// Using a lightweight persisted store instead of makeInMemoryStore (compat across versions)
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// MongoDB session persistence — keeps the shadow bound to you across
// Render restarts/redeploys, since Render's disk does not persist.
const { restoreSession, backupSession, clearSession } = require('./lib/mongoSession')

// Import a pre-generated session (from the MLTN;;; pairing site output) if
// SESSION_ID is set — this skips QR/pairing entirely on first boot.
const { importSessionId } = require('./lib/sessionId')

// Import lightweight store
const store = require('./lib/lightweight_store')

// Initialize store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Memory optimization - Force garbage collection if available
setInterval(() => {
    if (global.gc) {
        global.gc()
        console.log('🩸 The Shadow Army has been purged of the weak.')
    }
}, 60_000) // every 1 minute

// Memory monitoring - Restart if RAM gets too high
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 400) {
        console.log('⚔️ The Monarch\'s power overflows (>400MB) — descending to rise again...')
        process.exit(1) // Panel will auto-restart
    }
}, 30_000) // check every 30 seconds

// Safety-net backup of the session to MongoDB, in case creds.update ever
// fires less often than expected. Cheap no-op if MONGODB_URI isn't set.
setInterval(() => {
    backupSession()
}, 5 * 60_000) // every 5 minutes

let phoneNumber = ""
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "MLTN-MD"
global.themeemoji = "👑"

// UPDATED: pairing mode is no longer decided only by a hardcoded phoneNumber or a
// --pairing-code CLI flag. If neither is set, and we're in an interactive terminal
// with no existing session, the bot now asks you directly whether you want to bind
// via QR code or via a phone number pairing code — restoring the "ask me at startup"
// experience without forcing pairing-code mode by default.
let pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

// Only create readline interface if we're in an interactive environment
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        // In non-interactive environment, use ownerNumber from settings
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}

// Ask the user how they want to bind their shadow, if not already decided by
// a flag/hardcoded number, and only when there's no existing session to resume.
async function decidePairingMode() {
    if (pairingCode) return // already forced via flag or hardcoded number
    if (useMobile) return // mobile API path doesn't use this prompt
    if (!rl) return // non-interactive environment — just fall back to QR

    const sessionExists = existsSync('./session') && fs.readdirSync('./session').length > 0
    if (sessionExists) return // already bound, no need to ask again

    const choice = await question(
        chalk.bgBlack(
            chalk.magentaBright(
                `👑 Choose your binding ritual, Hunter:\n1. QR Code (scan with WhatsApp)\n2. Pairing Code (enter your phone number)\n\nType 1 or 2: `
            )
        )
    )

    if (choice.trim() === '2') {
        pairingCode = true
    }
}

async function startXeonBotInc() {
    try {
        // If a SESSION_ID env var (format: MLTN;;;<data>) is provided, decode
        // it and write the session files directly — this takes priority over
        // both the MongoDB-stored session and the QR/pairing prompt, since it
        // means you're explicitly telling the bot which session to use.
        if (process.env.SESSION_ID) {
            const imported = importSessionId(process.env.SESSION_ID)
            if (imported) {
                console.log(chalk.green('👑 Using session imported from SESSION_ID — skipping MongoDB restore and QR/pairing.'))
            } else {
                console.log(chalk.yellow('⚠️ SESSION_ID was set but could not be imported — falling back to MongoDB/QR/pairing.'))
            }
        }

        // Pull any previously saved session down from MongoDB before Baileys
        // reads ./session — this is what lets the bot survive a Render restart
        // without needing to re-pair. Harmless no-op if SESSION_ID already
        // wrote a valid session above and MongoDB has nothing newer.
        await restoreSession()

        await decidePairingMode()

        let { version, isLatest } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(`./session`)
        const msgRetryCounterCache = new NodeCache()

        const XeonBotInc = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: !pairingCode,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        })

        // Save credentials when they update, then mirror them into MongoDB
        // so the shadow's binding survives a Render restart/redeploy.
        XeonBotInc.ev.on('creds.update', async () => {
            await saveCreds()
            await backupSession()
        })

    store.bind(XeonBotInc.ev)

    // Message handling
    XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(XeonBotInc, chatUpdate);
                return;
            }
            // In private mode, only block non-group messages (allow groups for moderation)
            // Note: XeonBotInc.public is not synced, so we check mode in main.js instead
            // This check is kept for backward compatibility but mainly blocks DMs
            if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                const isGroup = mek.key?.remoteJid?.endsWith('@g.us')
                if (!isGroup) return // Block DMs in private mode, but allow group messages
            }
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            // Clear message retry cache to prevent memory bloat
            if (XeonBotInc?.msgRetryCounterCache) {
                XeonBotInc.msgRetryCounterCache.clear()
            }

           try {
                await handleMessages(XeonBotInc, chatUpdate, true)
            } catch (err) {
                console.error("A shadow soldier fell in battle (handleMessages error):", err)
                // Only try to send error message if we have a valid chatId
                if (mek.key && mek.key.remoteJid) {
                    await XeonBotInc.sendMessage(mek.key.remoteJid, {
                        text: '💀 Something stirred in the shadows and broke the ritual. Try again.'
                    }).catch(console.error);
                }
            }
        } catch (err) {
            console.error("A rift tore in the shadow gate (messages.upsert error):", err)
        }
    })

    // Add these event handlers for better functionality
    XeonBotInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    XeonBotInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = XeonBotInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    XeonBotInc.getName = (jid, withoutContact = false) => {
        id = XeonBotInc.decodeJid(jid)
        withoutContact = XeonBotInc.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ?
            XeonBotInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    XeonBotInc.public = true

    XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store)

    // Handle pairing code
    if (pairingCode && !XeonBotInc.authState.creds.registered) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        let phoneNumber
        if (!!global.phoneNumber) {
            phoneNumber = global.phoneNumber
        } else {
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`👑 Speak your number to bind yourself to the Shadow Monarch\nFormat: 6281376552730 (no + or spaces) : `)))
        }

        // Clean the phone number - remove any non-digit characters
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

        // Validate the phone number using awesome-phonenumber
        const pn = require('awesome-phonenumber');
        if (!pn('+' + phoneNumber).isValid()) {
            console.log(chalk.red('❌ That number holds no power here. Enter your full international number (e.g., 15551234567 for US, 447911123456 for UK) without + or spaces.'));
            process.exit(1);
        }

        setTimeout(async () => {
            try {
                let code = await XeonBotInc.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`🗝️ Your Sigil of Binding (Pairing Code): `)), chalk.black(chalk.white(code)))
                console.log(chalk.yellow(`\nEnter this sigil in your WhatsApp app:\n1. Open WhatsApp\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter the code shown above`))
            } catch (error) {
                console.error('The binding ritual failed (pairing code error):', error)
                console.log(chalk.red('❌ Failed to summon a pairing code. Check your number and try again.'))
            }
        }, 3000)
    }

    // Connection handling
    XeonBotInc.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect, qr } = s
        
        if (qr) {
            console.log(chalk.yellow('📜 A gate has opened. Scan the QR sigil with WhatsApp to bind your shadow.'))
        }
        
        if (connection === 'connecting') {
            console.log(chalk.yellow('🌑 Descending into the Shadow Realm... connecting to WhatsApp...'))
        }
        
        if (connection == "open") {
            console.log(chalk.magenta(` `))
            console.log(chalk.yellow(`👑 The Monarch has arisen => ` + JSON.stringify(XeonBotInc.user, null, 2)))

            // Confirm the session is safely mirrored to MongoDB right after
            // a successful connection, on top of the creds.update hook.
            await backupSession()

            try {
                const botNumber = XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
                await XeonBotInc.sendMessage(botNumber, {
                    text: `👑 MLTN-MD has Arisen.\n\n⏰ Time: ${new Date().toLocaleString()}\n⚔️ Status: Online and commanding the shadows!\n\n🩸 Join the ranks — join the channel below.`,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363161513685998@newsletter',
                            newsletterName: 'MLTN-MD',
                            serverMessageId: -1
                        }
                    }
                });
            } catch (error) {
                console.error('Failed to send the arisal message to the throne:', error.message)
            }

            await delay(1999)
            console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname || 'MLTN-MD'} — SHADOW MONARCH EDITION ]`)}\n\n`))
            console.log(chalk.cyan(`< ================= ARISE ================= >`))
            console.log(chalk.magenta(`\n${global.themeemoji || '👑'} SOVEREIGN: MILITAN`))
            console.log(chalk.magenta(`${global.themeemoji || '👑'} WA NUMBER: ${owner}`))
            console.log(chalk.magenta(`${global.themeemoji || '👑'} FORGED BY: MILITAN`))
            console.log(chalk.green(`${global.themeemoji || '👑'} 🩸 The Shadow Monarch has taken the throne! ✅`))
            console.log(chalk.blue(`Version: ${settings.version}`))
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
            const statusCode = lastDisconnect?.error?.output?.statusCode
            
            console.log(chalk.red(`⚰️ The gate has closed due to ${lastDisconnect?.error}. Rising again: ${shouldReconnect}`))
            
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                try {
                    rmSync('./session', { recursive: true, force: true })
                    console.log(chalk.yellow('🩸 The old pact is severed. Session deleted — re-authenticate to bind again.'))
                } catch (error) {
                    console.error('Failed to sever the old pact (session delete error):', error)
                }
                // Also purge the MongoDB copy, so a banished session
                // doesn't get silently restored on the next boot.
                await clearSession()
                console.log(chalk.red('🔒 Banished. Please re-authenticate.'))
            }
            
            if (shouldReconnect) {
                console.log(chalk.yellow('🌑 The Monarch stirs... reconnecting...'))
                await delay(5000)
                startXeonBotInc()
            }
        }
    })

    // Track recently-notified callers to avoid spamming messages
    const antiCallNotified = new Set();

    // Anticall handler: block callers when enabled
    // Anticall handler: block callers when enabled
    XeonBotInc.ev.on('call', async (calls) => {
        try {
            const { readState: readAnticallState } = require('./commands/anticall');
            const state = readAnticallState();
            if (!state.enabled) return;
            for (const call of calls) {
                // Skip group calls entirely — only act on 1:1 calls
                if (call.isGroup || (call.from || '').endsWith('@g.us')) continue;

                const callerJid = call.from || call.peerJid || call.chatId;
                if (!callerJid) continue;
                try {
                    // Attempt to reject the call if supported
                    try {
                        if (typeof XeonBotInc.rejectCall === 'function' && call.id) {
                            await XeonBotInc.rejectCall(call.id, callerJid);
                        } else if (typeof XeonBotInc.sendCallOfferAck === 'function' && call.id) {
                            await XeonBotInc.sendCallOfferAck(call.id, callerJid, 'reject');
                        }
                    } catch {}

                    // Notify the caller only once within a short window
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid);
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                        await XeonBotInc.sendMessage(callerJid, { text: '𓆩👑𓆪 *You do not have permission to call the Monarch.*\n\n⛧ Calls are forbidden in the Shadow Realm. Send a message instead.' });
                    }
                } catch {}
            }
        } catch (e) {
            // ignore
        }
    });

    XeonBotInc.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(XeonBotInc, update);
    });

    XeonBotInc.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(XeonBotInc, m);
        }
    });

    XeonBotInc.ev.on('status.update', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    XeonBotInc.ev.on('messages.reaction', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    return XeonBotInc
    } catch (error) {
        console.error('The ritual of summoning failed (startXeonBotInc error):', error)
        await delay(5000)
        startXeonBotInc()
    }
}


// Start the bot with error handling
startXeonBotInc().catch(error => {
    console.error('The Monarch could not arise (fatal error):', error)
    process.exit(1)
})
process.on('uncaughtException', (err) => {
    console.error('An uncaught shadow escaped containment:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('A shadow pact was left unfulfilled:', err)
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`🔄 The Monarch reforges itself: ${__filename}`))
    delete require.cache[file]
    require(file)
})
