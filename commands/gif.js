const axios = require('axios');
const settings = require('../settings'); // Assuming the API key is stored here

async function gifCommand(sock, chatId, query) {
    const apiKey = settings.giphyApiKey; // Replace with your Giphy API Key

    if (!query) {
        await sock.sendMessage(chatId, { text: '👑 Speak what vision you seek in the shadows.' });
        return;
    }

    try {
        const response = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
            params: {
                api_key: apiKey,
                q: query,
                limit: 1,
                rating: 'g'
            }
        });

        const gifUrl = response.data.data[0]?.images?.downsized_medium?.url;

        if (gifUrl) {
            await sock.sendMessage(chatId, { video: { url: gifUrl }, caption: `👑 Conjured from the shadows for "${query}"` });
        } else {
            await sock.sendMessage(chatId, { text: '🌑 The shadows hold no vision for that search.' });
        }
    } catch (error) {
        console.error('The shadow conjuring failed (GIF fetch error):', error);
        await sock.sendMessage(chatId, { text: '💀 Failed to conjure a GIF. Try again later.' });
    }
}

module.exports = gifCommand;