const axios = require('axios');

module.exports = async function (sock, chatId) {
    try {
        const response = await axios.get('https://icanhazdadjoke.com/', {
            headers: { Accept: 'application/json' }
        });
        const joke = response.data.joke;
        await sock.sendMessage(chatId, { text: `🖤 *A JEST FROM THE SHADOW REALM* 🖤\n『 M L T N - M D 』\n\n${joke}` });
    } catch (error) {
        console.error('Error fetching joke:', error);
        await sock.sendMessage(chatId, { text: '💀 *Even the shadows found nothing amusing.* Try again, Hunter.' });
    }
};