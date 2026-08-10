const fetch = require('node-fetch');

async function truthCommand(sock, chatId, message) {
    try {
        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/truth?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const truthMessage = json.result;

        // Send the truth message
        await sock.sendMessage(chatId, { text: `🖤 *A TRUTH TORN FROM THE SHADOWS* 🖤\n『 M L T N - M D 』\n\n${truthMessage}` }, { quoted: message });
    } catch (error) {
        console.error('Error in truth command:', error);
        await sock.sendMessage(chatId, { text: '💀 *The shadows have no truth to give.* Try again later, Hunter.' }, { quoted: message });
    }
}

module.exports = { truthCommand };