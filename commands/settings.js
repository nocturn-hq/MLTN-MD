const fs = require('fs');

function readJsonSafe(path, fallback) {
    try {
        const txt = fs.readFileSync(path, 'utf8');
        return JSON.parse(txt);
    } catch (_) {
        return fallback;
    }
}

const isOwnerOrSudo = require('../lib/isOwner');

async function settingsCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!message.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, { text: '⛧ Only the Monarch (MILITAN) may command these shadows!' }, { quoted: message });
            return;
        }

        const isGroup = chatId.endsWith('@g.us');
        const dataDir = './data';

        const mode = readJsonSafe(`${dataDir}/messageCount.json`, { isPublic: true });
        const autoStatus = readJsonSafe(`${dataDir}/autoStatus.json`, { enabled: false });
        const autoread = readJsonSafe(`${dataDir}/autoread.json`, { enabled: false });
        const autotyping = readJsonSafe(`${dataDir}/autotyping.json`, { enabled: false });
        const pmblocker = readJsonSafe(`${dataDir}/pmblocker.json`, { enabled: false });
        const anticall = readJsonSafe(`${dataDir}/anticall.json`, { enabled: false });
        const userGroupData = readJsonSafe(`${dataDir}/userGroupData.json`, {
            antilink: {}, antibadword: {}, welcome: {}, goodbye: {}, chatbot: {}, antitag: {}
        });
        const autoReaction = Boolean(userGroupData.autoReaction);

        // Per-group features
        const groupId = isGroup ? chatId : null;
        const antilinkOn = groupId ? Boolean(userGroupData.antilink && userGroupData.antilink[groupId]) : false;
        const antibadwordOn = groupId ? Boolean(userGroupData.antibadword && userGroupData.antibadword[groupId]) : false;
        const welcomeOn = groupId ? Boolean(userGroupData.welcome && userGroupData.welcome[groupId]) : false;
        const goodbyeOn = groupId ? Boolean(userGroupData.goodbye && userGroupData.goodbye[groupId]) : false;
        const chatbotOn = groupId ? Boolean(userGroupData.chatbot && userGroupData.chatbot[groupId]) : false;
        const antitagCfg = groupId ? (userGroupData.antitag && userGroupData.antitag[groupId]) : null;

        const on = '🟣 ACTIVE';
        const off = '⚫ DORMANT';

        const lines = [];
        lines.push('⛧═══「 𝗠𝗢𝗡𝗔𝗥𝗖𝗛 𝗗𝗘𝗖𝗥𝗘𝗘𝗦 」═══⛧');
        lines.push('');
        lines.push(`👑 Domain Mode: ${mode.isPublic ? 'Public' : 'Sealed (Private)'}`);
        lines.push(`🌘 Auto Status: ${autoStatus.enabled ? on : off}`);
        lines.push(`👁️ Autoread: ${autoread.enabled ? on : off}`);
        lines.push(`⌨️ Autotyping: ${autotyping.enabled ? on : off}`);
        lines.push(`🚪 PM Blocker: ${pmblocker.enabled ? on : off}`);
        lines.push(`📵 Anticall: ${anticall.enabled ? on : off}`);
        lines.push(`🎭 Auto Reaction: ${autoReaction ? on : off}`);
        if (groupId) {
            lines.push('');
            lines.push(`⛧ Domain: ${groupId}`);
            if (antilinkOn) {
                const al = userGroupData.antilink[groupId];
                lines.push(`🔗 Antilink: ${on} (punishment: ${al.action || 'delete'})`);
            } else {
                lines.push(`🔗 Antilink: ${off}`);
            }
            if (antibadwordOn) {
                const ab = userGroupData.antibadword[groupId];
                lines.push(`🗯️ Antibadword: ${on} (punishment: ${ab.action || 'delete'})`);
            } else {
                lines.push(`🗯️ Antibadword: ${off}`);
            }
            lines.push(`🚶 Welcome Rite: ${welcomeOn ? on : off}`);
            lines.push(`⚰️ Farewell Rite: ${goodbyeOn ? on : off}`);
            lines.push(`🤖 Chatbot Spirit: ${chatbotOn ? on : off}`);
            if (antitagCfg && antitagCfg.enabled) {
                lines.push(`🏷️ Antitag: ${on} (punishment: ${antitagCfg.action || 'delete'})`);
            } else {
                lines.push(`🏷️ Antitag: ${off}`);
            }
        } else {
            lines.push('');
            lines.push('⛧ Enter a domain (group) to reveal its own decrees.');
        }

        await sock.sendMessage(chatId, { text: lines.join('\n') }, { quoted: message });
    } catch (error) {
        console.error('Error in settings command:', error);
        await sock.sendMessage(chatId, { text: '☠️ The shadows could not reveal the decrees.' }, { quoted: message });
    }
}

module.exports = settingsCommand;