const settings = require("../settings");
async function aliveCommand(sock, chatId, message) {
    try {
        const message1 = `*👑 MLTN-MD Has Arisen*\n\n` +
                       `*Version:* ${settings.version}\n` +
                       `*Status:* Awake and watching\n` +
                       `*Mode:* Public\n\n` +
                       `*🩸 Powers of the Monarch:*\n` +
                       `• Group Domination\n` +
                       `• Antilink Banishment\n` +
                       `• Chaos & Fun Commands\n` +
                       `• And far more...\n\n` +
                       `Type *.menu* to command the shadow army`;

        await sock.sendMessage(chatId, {
            text: message1
        }, { quoted: message });
    } catch (error) {
        console.error('The arisal ritual faltered (alive command error):', error);
        await sock.sendMessage(chatId, { text: '👑 The Monarch still breathes.' }, { quoted: message });
    }
}

module.exports = aliveCommand;