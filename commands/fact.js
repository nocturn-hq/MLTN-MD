const axios = require('axios');

module.exports = async function (sock, chatId, message) {
    try {
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
        const fact = response.data.text;
        await sock.sendMessage(chatId, { text: `👑 A shadow fragment of knowledge:\n\n${fact}` },{ quoted: message });
    } catch (error) {
        console.error('The shadow archive would not yield a fact (fact command error):', error);
        await sock.sendMessage(chatId, { text: '💀 The shadows have no fact to offer right now.' },{ quoted: message });
    }
};