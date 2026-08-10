const os = require('os');
const settings = require('../settings.js');

function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;

    return time.trim();
}

// Pick a reaction-speed rank based on ping — pure flavor, no logic change
function getSpeedRank(ping) {
    if (ping <= 50) return '👑 Monarch Reflex';
    if (ping <= 150) return '⛧ Shadow Step';
    if (ping <= 400) return '🗡️ Hunter Grade';
    return '🐢 Awakening...';
}

async function pingCommand(sock, chatId, message) {
    try {
        const start = Date.now();
        await sock.sendMessage(chatId, { text: '⛧ ...Arise.' }, { quoted: message });
        const end = Date.now();
        const ping = Math.round((end - start) / 2);

        const uptimeInSeconds = process.uptime();
        const uptimeFormatted = formatTime(uptimeInSeconds);
        const rank = getSpeedRank(ping);

        const botInfo = `
╔═.·:·.☾ 👑 ☽.·:·.═╗
   *𝐌𝐋𝐓𝐍-𝐌𝐃*
   "I alone summon the shadows."
╚═.·:·.☾ ⛧ ☽.·:·.═╝

⚔️ *Response* ⋮ ${ping} ms
🔮 *Rank*     ⋮ ${rank}
⏳ *Bound for* ⋮ ${uptimeFormatted}
📜 *Sigil Ver.* ⋮ v${settings.version}

⛧ The shadow army answers your call. ⛧`.trim();

        // Reply to the original message with the bot info
        await sock.sendMessage(chatId, { text: botInfo },{ quoted: message });

    } catch (error) {
        console.error('Error in ping command:', error);
        await sock.sendMessage(chatId, { text: '☠️ The shadows did not answer. Something broke the bond.' });
    }
}

module.exports = pingCommand;