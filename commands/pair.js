async function pairCommand(sock, chatId, message) {
    await sock.sendMessage(chatId, {
        text: `👑 *Bind Your Shadow to MLTN-MD*\n\n⛧ Visit the forge below and enter your WhatsApp number to receive your binding sigil:\n\nhttps://pairing-zpiy.onrender.com\n\n🩸 Once bound, arise as a soldier of the shadow army.`
    }, { quoted: message });
}

module.exports = pairCommand;
