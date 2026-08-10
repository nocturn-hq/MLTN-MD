const fetch = require('node-fetch');

async function dareCommand(sock, chatId, message) {
    try {
        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/dare?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const dareMessage = json.result;

        // Send the dare message
        await sock.sendMessage(chatId, { text: `👑 The Monarch dares you:\n\n${dareMessage}` }, { quoted: message });
    } catch (error) {
        console.error('The shadow trial failed to summon (dare command error):', error);
        await sock.sendMessage(chatId, { text: '💀 The shadows could not conjure a dare. Try again later!' }, { quoted: message });
    }
}

module.exports = { dareCommand };