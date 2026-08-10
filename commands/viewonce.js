const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
async function viewonceCommand(sock, chatId, message) {
    // Extract quoted imageMessage or videoMessage from your structure
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quoted?.imageMessage;
    const quotedVideo = quoted?.videoMessage;

    // Send revealed media to your own number instead of the chat it was used in
    const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

    if (quotedImage && quotedImage.viewOnce) {
        // Download and send the image
        const stream = await downloadContentFromMessage(quotedImage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await sock.sendMessage(ownerJid, { image: buffer, fileName: 'media.jpg', caption: quotedImage.caption || '⛧ Nothing stays hidden from the shadows.' });
        await sock.sendMessage(chatId, { text: '☠️ Revealed and sent to you privately.' }, { quoted: message });
    } else if (quotedVideo && quotedVideo.viewOnce) {
        // Download and send the video
        const stream = await downloadContentFromMessage(quotedVideo, 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await sock.sendMessage(ownerJid, { video: buffer, fileName: 'media.mp4', caption: quotedVideo.caption || '⛧ Nothing stays hidden from the shadows.' });
        await sock.sendMessage(chatId, { text: '☠️ Revealed and sent to you privately.' }, { quoted: message });
    } else {
        await sock.sendMessage(chatId, { text: '☠️ Reply to a view-once image or video for the shadows to reveal it.' }, { quoted: message });
    }
}
module.exports = viewonceCommand;
