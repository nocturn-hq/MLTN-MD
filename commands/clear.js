async function clearCommand(sock, chatId) {
    try {
        const message = await sock.sendMessage(chatId, { text: '🌑 Erasing all trace from the shadows...' });
        const messageKey = message.key; // Get the key of the message the bot just sent
        
        // Now delete the bot's message
        await sock.sendMessage(chatId, { delete: messageKey });
        
    } catch (error) {
        console.error('The erasure ritual failed (clear command error):', error);
        await sock.sendMessage(chatId, { text: '💀 The shadows failed to erase this trace.' });
    }
}

module.exports = { clearCommand };